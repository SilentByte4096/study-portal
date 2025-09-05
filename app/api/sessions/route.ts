// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const createSessionSchema = z.object({
  type: z.enum(['pomodoro', 'custom', 'break']).default('pomodoro'),
  duration: z.number().min(1, 'Duration must be greater than 0'),
  plannedDuration: z.number().optional(),
  focusRating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  goalId: z.string().optional(),
  materialIds: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      include: {
        goal: {
          select: { id: true, title: true }
        },
        materials: {
          include: {
            material: {
              select: { id: true, title: true, type: true }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset
    });

    const totalSessions = await prisma.studySession.count({
      where: { userId: user.id }
    });

    return NextResponse.json({ 
      sessions: sessions.map(session => ({
        ...session,
        materials: session.materials.map(m => m.material)
      })),
      totalSessions,
      hasMore: offset + sessions.length < totalSessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSessionSchema.parse(body);

    const session = await prisma.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.studySession.create({
        data: {
          type: data.type,
          duration: data.duration,
          plannedDuration: data.plannedDuration || null,
          focusRating: data.focusRating || null,
          notes: data.notes || null,
          tags: data.tags,
          completed: true,
          userId: user.id,
          goalId: data.goalId || null,
          endedAt: new Date(),
        }
      });

      // Link materials if provided
      if (data.materialIds && data.materialIds.length > 0) {
        await tx.studySessionMaterial.createMany({
          data: data.materialIds.map(materialId => ({
            sessionId: newSession.id,
            materialId
          }))
        });
      }

      // Update goal progress if goal is specified
      if (data.goalId && data.type !== 'break') {
        const goal = await tx.goal.findUnique({
          where: { id: data.goalId, userId: user.id }
        });

        if (goal) {
          let progressIncrement = 0;
          
          switch (goal.type) {
            case 'time':
              progressIncrement = data.duration; // minutes
              break;
            case 'sessions':
              progressIncrement = 1;
              break;
            case 'materials':
              progressIncrement = data.materialIds.length;
              break;
          }

          if (progressIncrement > 0) {
            await tx.goal.update({
              where: { id: data.goalId },
              data: {
                current: goal.current + progressIncrement,
                completed: (goal.current + progressIncrement) >= goal.target
              }
            });

            // Log progress
            await tx.goalProgress.create({
              data: {
                goalId: data.goalId,
                value: progressIncrement,
                notes: `Study session: ${data.duration} minutes`
              }
            });
          }
        }
      }

      return newSession;
    });

    // Fetch the complete session with relations
    const completeSession = await prisma.studySession.findUnique({
      where: { id: session.id },
      include: {
        goal: {
          select: { id: true, title: true }
        },
        materials: {
          include: {
            material: {
              select: { id: true, title: true, type: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      session: {
        ...completeSession,
        materials: completeSession?.materials.map(m => m.material) || []
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify ownership before deletion
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Use transaction for cascade deletion
    await prisma.$transaction(async (tx) => {
      // Delete session-material links
      await tx.studySessionMaterial.deleteMany({
        where: { sessionId }
      });
      
      // Finally delete the session
      await tx.studySession.delete({
        where: { id: sessionId },
      });
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
