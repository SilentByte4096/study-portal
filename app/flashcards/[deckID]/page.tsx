// app/flashcards/[deckId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type CardItem = { id: string; front: string; back: string; hint: string | null; createdAt: string };
type Deck = { id: string; name: string; description: string | null; cards: CardItem[] };
type DeckResponse = { deck: Deck };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export default function DeckDetailPage() {
  // Match the folder segment: if your folder is [deckID], use useParams<{ deckID: string }>()
  const { deckId } = useParams<{ deckId: string }>();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  async function load(currentId: string) {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/flashcards/${encodeURIComponent(currentId)}`, { credentials: 'include' });
      if (!res.ok) {
        let serverMsg = '';
        try { const d = (await res.json()) as { error?: string }; serverMsg = d?.error ?? ''; } catch {}
        throw new Error(serverMsg || `Failed to load deck (${res.status})`);
      }
      const data = (await res.json()) as DeckResponse;
      setDeck(data.deck);
      setActiveId(null);
      setShowAnswer(false);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // Refetch when the route param changes
  useEffect(() => {
    if (typeof deckId === 'string' && deckId.length > 0) {
      void load(deckId);
    }
  }, [deckId]);

  function selectCard(id: string) {
    setActiveId(id);
    setShowAnswer(false);
  }

  if (!deckId) return <div className="p-6 text-red-600">Invalid deck id</div>;
  if (loading) return <div className="p-6">Loading deck…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!deck) return <div className="p-6 text-red-600">Deck not found</div>;

  const active = deck.cards.find((c) => c.id === activeId) ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{deck.name}</h1>
        {deck.description && <p className="text-sm text-muted-foreground">{deck.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cards list */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Cards</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deck.cards.length === 0 ? (
              <div className="text-sm text-muted-foreground">No cards yet.</div>
            ) : (
              deck.cards.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <motion.button
                    key={c.id}
                    onClick={() => selectCard(c.id)}
                    className={`w-full text-left rounded border px-3 py-2 ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-muted'}`}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <div className="font-medium">{c.front}</div>
                    {c.hint && <div className="text-xs text-muted-foreground mt-1">Hint: {c.hint}</div>}
                  </motion.button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Viewer */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Viewer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!active ? (
              <div className="text-sm text-muted-foreground">Select a card to view the question.</div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Question</div>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded border p-4"
                >
                  <div className="text-base">{active.front}</div>
                </motion.div>

                <div className="flex gap-3">
                  <Button onClick={() => setShowAnswer((v) => !v)}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Button>
                </div>

                <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="rounded border p-4 bg-muted"
                    >
                      <div className="text-sm text-muted-foreground mb-1">Answer</div>
                      <div className="text-base">{active.back}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}