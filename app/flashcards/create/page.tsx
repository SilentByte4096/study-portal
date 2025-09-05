// app/flashcards/create/page.tsx
'use client';

import React, { useState } from 'react';

type NewCard = { front: string; back: string; hint?: string };
type CreateDeckPayload = {
  name: string;
  description: string | null;
  cards: { front: string; back: string; hint: string | null }[];
};
type CreateDeckResponse = {
  deck: {
    id: string;
    name: string;
    description: string | null;
    _count?: { cards: number };
    createdAt: string;
  };
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function CreateDeckPage() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [cards, setCards] = useState<NewCard[]>([{ front: '', back: '' }]);
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const addCard = () => setCards((c) => [...c, { front: '', back: '' }]);
  const updateCard = (i: number, key: keyof NewCard, val: string) =>
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, [key]: val } : card)));
  const removeCard = (i: number) => setCards((c) => c.filter((_, idx) => idx !== i));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const payload: CreateDeckPayload = {
        name,
        description: description ? description : null,
        cards: cards
          .filter((c) => c.front.trim() && c.back.trim())
          .map((c) => ({
            front: c.front.trim(),
            back: c.back.trim(),
            hint: c.hint && c.hint.trim() ? c.hint.trim() : null,
          })),
      };

      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let serverMsg = '';
        try {
          const data = (await res.json()) as { error?: string };
          serverMsg = data?.error ?? '';
        } catch {}
        throw new Error(serverMsg || `Failed to create deck (${res.status})`);
      }

      const data = (await res.json()) as CreateDeckResponse;
      setOk(`Deck "${data.deck.name}" created successfully.`);
      setName('');
      setDescription('');
      setCards([{ front: '', back: '' }]);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold">Create Flashcard Deck</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Deck name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="e.g. CS Fundamentals"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description (optional)</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="Short description"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium">Cards</div>
          {cards.map((c, i) => (
            <div key={i} className="rounded border p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Front"
                  value={c.front}
                  onChange={(e) => updateCard(i, 'front', e.currentTarget.value)}
                  required
                />
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Back"
                  value={c.back}
                  onChange={(e) => updateCard(i, 'back', e.currentTarget.value)}
                  required
                />
              </div>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Hint (optional)"
                value={c.hint || ''}
                onChange={(e) => updateCard(i, 'hint', e.currentTarget.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeCard(i)}
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCard} className="rounded border px-3 py-2 text-sm">
            + Add Card
          </button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-green-600">{ok}</div>}

        <button
          type="submit"
          disabled={saving || !name}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Deck'}
        </button>
      </form>
    </div>
  );
}