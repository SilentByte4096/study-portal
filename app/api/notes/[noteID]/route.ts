// app/api/notes/[noteId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const note = await prisma.note.findFirst({
      where: { id: params.noteId, userId: user.id },
    });
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: 'Failed to load note' }, { status: 500 });
  }
}
