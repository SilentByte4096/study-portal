// app/api/materials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';

const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  type: z.enum(['pdf', 'doc', 'video', 'audio', 'image', 'url', 'other']),
  url: z.string().url().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  color: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  filePath: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
}); [4]

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]

    const materials = await prisma.studyMaterial.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }); [3]

    const normalized = materials.map((m) => ({
      ...m,
      fileSize: m.fileSize != null ? m.fileSize.toString() : null,
    }));
    return NextResponse.json({ materials: normalized }); [3]
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
    console.error('Error fetching materials:', message);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 }); [3]
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); [3]

    const body = (await request.json()) as unknown;
    const data = createMaterialSchema.parse(body); [4]

    const created = await prisma.studyMaterial.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        url: data.url ?? null,
        category: data.category ?? null,
        tags: data.tags ?? [],
        color: data.color ?? null,
        folderId: data.folderId ?? null,
        filePath: data.filePath ?? null,
        fileName: data.fileName ?? null,
        mimeType: data.mimeType ?? null,
        fileSize: data.fileSize != null ? BigInt(data.fileSize) : null,
        userId: user.id,
      },
    }); [3]

    return NextResponse.json(
      {
        material: {
          ...created,
          fileSize: created.fileSize != null ? created.fileSize.toString() : null,
        },
      },
      { status: 201 }
    ); [3]
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 }); [4]
    }
    const message = err instanceof Error ? err.message : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
    console.error('Error creating material:', message);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 }); [3]
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const url = new URL(request.url);
    const materialId = url.searchParams.get('materialId');
    
    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    // Verify ownership before deletion
    const material = await prisma.studyMaterial.findFirst({
      where: { id: materialId, userId: user.id },
    });
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found or access denied' }, { status: 404 });
    }

    // Use transaction for cascade deletion
    await prisma.$transaction(async (tx) => {
      // Delete related note-material links
      await tx.noteMaterialLink.deleteMany({
        where: { materialId }
      });
      
      // Delete related session-material links
      await tx.studySessionMaterial.deleteMany({
        where: { materialId }
      });
      
      // Delete related goal-material links
      await tx.goalMaterial.deleteMany({
        where: { materialId }
      });
      
      // Finally delete the material
      await tx.studyMaterial.delete({
        where: { id: materialId },
      });
    });

    return NextResponse.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
