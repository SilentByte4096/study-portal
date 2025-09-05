// app/flashcards/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: { cards: number };
};

type DecksResponse = { decks: Deck[] };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/flashcards', { credentials: 'include' });
        if (!res.ok) {
          let serverMsg = '';
          try { const d = (await res.json()) as { error?: string }; serverMsg = d?.error ?? ''; } catch {}
          throw new Error(serverMsg || `Failed to load decks (${res.status})`);
        }
        const data = (await res.json()) as DecksResponse;
        setDecks(Array.isArray(data.decks) ? data.decks : []);
      } catch (e: unknown) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading decks…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Flashcard Decks</h1>
        <Link href="/flashcards/create"><Button>Create Deck</Button></Link>
      </div>
      {decks.length === 0 ? (
        <div className="text-muted-foreground">No decks yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <Link key={d.id} href={`/flashcards/${d.id}`}>
              <Card className="hover:shadow-sm transition">
                <CardHeader>
                  <CardTitle className="text-base">{d.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {d.description || 'No description'}{d._count ? ` • ${d._count.cards} cards` : ''}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}