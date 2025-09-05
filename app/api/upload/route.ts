// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getUserFromRequest } from '@/lib/auth-utils';

function guessExt(originalName: string, mime: string | null): string {
  const dot = originalName.lastIndexOf('.');
  if (dot !== -1 && dot < originalName.length - 1) return originalName.slice(dot);
  if (!mime) return '';
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('word') || mime.includes('document')) return '.docx';
  if (mime.startsWith('image/')) return '.png';
  return '';
} [5]

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
} [1]

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]

    const form = await request.formData();
    const entry = form.get('file');
    if (!(typeof File !== 'undefined' && entry instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    } [1]

    const file: File = entry;
    const originalName = file.name || `${randomUUID()}`;
    const mimeType = file.type || 'application/octet-stream';

    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const outName = `${randomUUID()}${guessExt(originalName, mimeType)}`;
    const outPathFs = join(uploadsDir, outName);
    const outPathPublic = `/uploads/${outName}`;

    const buffer = await blobToBuffer(file);
    await writeFile(outPathFs, buffer);

    return NextResponse.json({
      path: outPathPublic,
      fileName: originalName,
      size: buffer.length,
      mimeType,
    }); [1]
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
    console.error('Upload error:', message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 }); [3]
  }
}
