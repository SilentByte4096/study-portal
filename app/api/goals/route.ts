// app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['time', 'materials', 'flashcards', 'sessions']),
  target: z.number().min(1, 'Target must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  deadline: z.string().transform((str) => new Date(str)),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      include: {
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = createGoalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        target: data.target,
        current: 0,
        unit: data.unit,
        deadline: data.deadline,
        priority: data.priority,
        userId: user.id,
      },
      include: {
        progress: true
      }
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const goalId = url.searchParams.get('goalId');
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Verify ownership
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        progress: true
      }
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const url = new URL(request.url);
    const goalId = url.searchParams.get('goalId');
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Verify ownership before deletion
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    // Use transaction for cascade deletion
    await prisma.$transaction(async (tx) => {
      // Delete goal progress records
      await tx.goalProgress.deleteMany({
        where: { goalId }
      });
      
      // Delete goal-material links
      await tx.goalMaterial.deleteMany({
        where: { goalId }
      });
      
      // Update study sessions to remove goal reference
      await tx.studySession.updateMany({
        where: { goalId },
        data: { goalId: null }
      });
      
      // Finally delete the goal
      await tx.goal.delete({
        where: { id: goalId },
      });
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
