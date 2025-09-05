// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
  materialId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  isPinned: z.boolean().optional(),
}); [4]

type CreateNoteBody = z.infer<typeof createNoteSchema>;

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]
  try {
    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ notes }); [3]
  } catch {
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 }); [3]
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]
  try {
    const body = (await request.json()) as unknown;
    const data: CreateNoteBody = createNoteSchema.parse(body); [4]
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.content.slice(0, 140),
        tags: data.tags ?? [],
        color: data.color ?? null,
        isPublic: data.isPublic ?? false,
        isPinned: data.isPinned ?? false,
        userId: user.id,
        folderId: data.folderId ?? null,
      },
    });
    return NextResponse.json({ note }, { status: 201 }); [3]
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 }); [4]
    }
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 }); [3]
  }
}