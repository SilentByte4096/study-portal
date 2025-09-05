// app/api/flashcards/[deckId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const addCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  hint: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: params.deckId, userId: user.id },
      include: { cards: { orderBy: { createdAt: 'desc' } } },
    });
    if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ deck });
  } catch {
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as unknown;
    const data = addCardSchema.parse(body);
    // Ownership guard
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: params.deckId, userId: user.id },
      select: { id: true },
    });
    if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const card = await prisma.flashcard.create({
      data: {
        front: data.front,
        back: data.back,
        hint: data.hint ?? null,
        deckId: params.deckId,
      },
    });
    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 });
  }
}