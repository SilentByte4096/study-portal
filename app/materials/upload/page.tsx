// app/materials/upload/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadResult = {
  path: string;
  fileName: string;
  size: number;
  mimeType: string;
};

type SaveResult = {
  material: {
    id: string;
    title: string;
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

export default function UploadMaterialsPage() {
  // Multi-file state for selected files
  const [files, setFiles] = useState<File[]>([]);
  const [titlePrefix, setTitlePrefix] = useState<string>(''); // optional prefix applied to each material title
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Accept an array and store the entire array for multi-file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true, // enable multiple upload
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      setErr('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setErr(null);
    setOk(null);

    try {
      // 1) Upload all files to /api/upload in parallel
      const uploadPayloads = await Promise.all(
        files.map(async (file) => {
          const form = new FormData();
          form.append('file', file);

          const upRes = await fetch('/api/upload', {
            method: 'POST',
            body: form,
            credentials: 'include',
          });

          if (!upRes.ok) {
            let serverMsg = '';
            try {
              const data = (await upRes.json()) as { error?: string };
              serverMsg = data?.error ?? '';
            } catch {}
            throw new Error(serverMsg || `Upload failed (${upRes.status}) for ${file.name}`);
          }

          const payload = (await upRes.json()) as UploadResult;

          return {
            file,
            uploadedPath: payload.path ?? null,
            mimeType: payload.mimeType ?? file.type ?? null,
            fileSize: payload.size ?? file.size ?? null,
            fileName: payload.fileName ?? file.name ?? null,
          };
        })
      );

      // 2) Persist one material per uploaded file
      await Promise.all(
        uploadPayloads.map(async (p) => {
          const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: `${titlePrefix ? `${titlePrefix} - ` : ''}${p.fileName ?? 'Untitled'}`,
              description: null,
              type: deriveType(p.mimeType ?? undefined),
              url: null,
              category: category || null,
              tags: tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
              color: null,
              folderId: null,
              filePath: p.uploadedPath,
              fileName: p.fileName,
              mimeType: p.mimeType,
              fileSize: p.fileSize,
            }),
          });

          if (!res.ok) {
            let serverMsg = '';
            try {
              const data = (await res.json()) as { error?: string };
              serverMsg = data?.error ?? '';
            } catch {}
            throw new Error(serverMsg || `Failed to save material (${res.status}) for ${p.fileName}`);
          }

          // Optional: read response if you want to display created IDs/titles
          await res.json() as SaveResult;
        })
      );

      setOk(`Uploaded ${files.length} file(s) successfully.`);
      // reset inputs
      setFiles([]);
      setTitlePrefix('');
      setCategory('');
      setTags('');
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold">Upload Multiple Materials</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          {...getRootProps()}
          className={`flex h-48 cursor-pointer items-center justify-center rounded border ${
            isDragActive ? 'border-blue-600 bg-blue-50' : 'border-dashed'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-sm text-gray-600 text-center">
            Drag & drop files here, or click to select (PDF, DOC/DOCX, images)
          </div>
        </div>

        {files.length > 0 && (
          <div className="rounded border p-4">
            <div className="mb-2 text-sm font-medium">Selected files ({files.length})</div>
            <ul className="space-y-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{f.name}</span>{' '}
                    <span className="text-gray-500">• {(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Title prefix (optional)</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={titlePrefix}
              onChange={(e) => setTitlePrefix(e.target.value)}
              placeholder="e.g. Semester 1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Will be prepended to each material’s title (file name follows).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">Category</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. vectors, matrices"
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-green-600">{ok}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : `Upload ${files.length || ''}`}
          </button>
          <button
            type="button"
            onClick={() => setFiles([])}
            className="rounded border px-4 py-2 hover:bg-gray-50"
            disabled={uploading || files.length === 0}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

function deriveType(mt?: string): 'pdf' | 'doc' | 'image' | 'other' | 'url' {
  if (!mt) return 'other';
  if (mt.includes('pdf')) return 'pdf';
  if (mt.includes('word') || mt.includes('document')) return 'doc';
  if (mt.startsWith('image/')) return 'image';
  return 'other';
}