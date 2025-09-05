// app/notes/new/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Link from 'next/link';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export default function NewNotePage() {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setErr(null); setOk(null);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, tags: [] }),
      });
      if (!res.ok) {
        let serverMsg = '';
        try { const d = (await res.json()) as { error?: string }; serverMsg = d?.error ?? ''; } catch {}
        throw new Error(serverMsg || `Failed to create note (${res.status})`);
      }
      setOk('Note created.');
      setTitle(''); setContent('');
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex items-center justify-between sm:flex-row sm:items-center">
            <CardTitle>Create Note</CardTitle>
            <Link href="/notes" className="text-sm text-blue-600 hover:underline">Back to notes</Link>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Content</label>
                <Textarea value={content} onChange={(e) => setContent(e.currentTarget.value)} className="min-h-[200px]" required />
              </div>
              {err && <div className="text-sm text-red-600">{err}</div>}
              {ok && <div className="text-sm text-green-600">{ok}</div>}
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Note'}</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
