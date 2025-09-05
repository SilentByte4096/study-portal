// app/notes/[noteId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Note = { id: string; title: string; content: string; createdAt: string };

export default function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, { credentials: 'include' });
        if (!res.ok) {
          let msg = '';
          try { const d = (await res.json()) as { error?: string }; msg = d?.error ?? ''; } catch {}
          throw new Error(msg || `Failed to load note (${res.status})`);
        }
        const data = (await res.json()) as { note: Note };
        if (!ignore) setNote(data.note);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (noteId) void load();
    return () => { ignore = true; };
  }, [noteId]);

  if (!noteId) return <div className="p-6 text-red-600">Invalid note id</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!note) return <div className="p-6 text-red-600">Note not found</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{note.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">{note.content}</div>
        </CardContent>
      </Card>
    </div>
  );
}
