// app/materials/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Material = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  createdAt: string;
  filePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: string | null; // stringified BigInt from API
};

type MaterialsResponse = { materials: Material[] };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
} [6]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/materials', { credentials: 'include' });
        if (!res.ok) {
          let serverMsg = '';
          try { const d = (await res.json()) as { error?: string }; serverMsg = d?.error ?? ''; } catch {}
          throw new Error(serverMsg || `Failed to load materials (${res.status})`);
        }
        const data = (await res.json()) as MaterialsResponse;
        setMaterials(Array.isArray(data.materials) ? data.materials : []);
      } catch (e: unknown) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading materials…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Materials</h1>
        <Link href="/materials/upload" className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
          Upload Material
        </Link>
      </div>

      {materials.length === 0 ? (
        <div className="text-muted-foreground">No materials yet. Upload one to get started.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <li key={m.id} className="rounded border p-4 space-y-2">
              <div className="text-sm text-gray-500">{m.type?.toUpperCase()}</div>
              <div className="font-medium">{m.title}</div>
              <div className="text-sm text-gray-500">
                {m.category ?? 'Uncategorized'} • {new Date(m.createdAt).toLocaleDateString()}
              </div>
              {m.filePath && (
                <a
                  href={`/api/files/${m.filePath.split('/').pop()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-blue-600 hover:underline text-sm"
                >
                  Open
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
