// app/api/files/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, basename } from 'path';

function contentTypeFor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/octet-stream';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const safeName = basename(params.filename);
    const filePath = join(process.cwd(), 'uploads', safeName);

    const [buf, st] = await Promise.all([readFile(filePath), stat(filePath)]);

    // Wrap the Node Buffer in a Uint8Array to satisfy BlobPart typing
    const bytes = new Uint8Array(buf); // valid BlobPart chunk [1]
    const type = contentTypeFor(safeName);
    const blob = new Blob([bytes], { type }); // Blob accepts Uint8Array in its parts array [1]

    const headers = new Headers();
    headers.set('Content-Type', type);
    headers.set('Content-Length', String(st.size));
    headers.set('Content-Disposition', `inline; filename="${safeName}"`);

    return new Response(blob, { status: 200, headers }); // BodyInit is Blob, OK in App Router [11][13]
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 }); // Fallback JSON [13]
  }
}