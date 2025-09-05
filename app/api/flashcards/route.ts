// app/api/flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const cardSchema = z.object({
  front: z.string().min(1, 'Front is required'),
  back: z.string().min(1, 'Back is required'),
  hint: z.string().nullable().optional(),
});

const createDeckSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  cards: z.array(cardSchema).optional(),
}); [4]

type CreateDeckBody = z.infer<typeof createDeckSchema>;

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]
  try {
    const decks = await prisma.flashcardDeck.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    return NextResponse.json({ decks }); [3]
  } catch {
    return NextResponse.json({ error: 'Failed to load decks' }, { status: 500 }); [3]
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]
  try {
    const body = (await request.json()) as unknown;
    const data: CreateDeckBody = createDeckSchema.parse(body); [4]
    const deck = await prisma.flashcardDeck.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        userId: user.id,
        cards: data.cards && data.cards.length
          ? { create: data.cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint ?? null })) }
          : undefined,
      },
      include: { _count: { select: { cards: true } } },
    });
    return NextResponse.json({ deck }, { status: 201 }); [3]
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 }); [4]
    }
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 }); [3]
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const url = new URL(request.url);
    const deckId = url.searchParams.get('deckId');
    
    if (!deckId) {
      return NextResponse.json({ error: 'Deck ID is required' }, { status: 400 });
    }

    // Verify ownership before deletion
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: deckId, userId: user.id },
    });
    
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found or access denied' }, { status: 404 });
    }

    // Use transaction for cascade deletion
    await prisma.$transaction(async (tx) => {
      // Delete all review logs for cards in this deck
      await tx.reviewLog.deleteMany({
        where: {
          card: {
            deckId: deckId
          }
        }
      });
      
      // Delete all cards in the deck
      await tx.flashcard.deleteMany({
        where: { deckId }
      });
      
      // Delete deck stats
      await tx.deckStats.deleteMany({
        where: { deckId }
      });
      
      // Finally delete the deck
      await tx.flashcardDeck.delete({
        where: { id: deckId },
      });
    });

    return NextResponse.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}
