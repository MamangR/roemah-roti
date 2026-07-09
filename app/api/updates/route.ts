import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// ─── GET /api/updates?type=newMenu|promo|announcement ─────────────────────────
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');

  if (type === 'newMenu') {
    const items = await prisma.newMenu.findMany({ orderBy: { createdAt: 'desc' } });
    return Response.json(items);
  }
  if (type === 'promo') {
    const items = await prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
    return Response.json(items);
  }
  if (type === 'announcement') {
    const items = await prisma.announcement.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] });
    return Response.json(items);
  }

  return Response.json({ error: 'type param required: newMenu | promo | announcement' }, { status: 400 });
}

// ─── POST /api/updates ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'newMenu') {
      const item = await prisma.newMenu.create({
        data: {
          name: data.name,
          category: data.category,
          shortDesc: data.shortDesc,
          longDesc: data.longDesc,
          imageUrl: data.imageUrl || null,
          dateAdded: data.dateAdded,
          status: data.status ?? 'Draft',
        },
      });
      return Response.json(item);
    }

    if (type === 'promo') {
      const item = await prisma.promo.create({
        data: {
          name: data.name,
          shortDesc: data.shortDesc,
          longDesc: data.longDesc,
          imageUrl: data.imageUrl || null,
          terms: data.terms ?? [],
          startDate: data.startDate,
          endDate: data.endDate,
          promoStatus: data.promoStatus ?? 'Aktif',
        },
      });
      return Response.json(item);
    }

    if (type === 'announcement') {
      const item = await prisma.announcement.create({
        data: {
          title: data.title,
          summary: data.summary,
          content: data.content,
          outlet: data.outlet ?? 'All outlets',
          pinned: data.pinned ?? false,
          datePosted: data.datePosted,
        },
      });
      return Response.json(item);
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    console.error('[api/updates POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/updates ─────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    if (type === 'newMenu') {
      const item = await prisma.newMenu.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          shortDesc: data.shortDesc,
          longDesc: data.longDesc,
          imageUrl: data.imageUrl || null,
          dateAdded: data.dateAdded,
          status: data.status,
        },
      });
      return Response.json(item);
    }

    if (type === 'promo') {
      const item = await prisma.promo.update({
        where: { id },
        data: {
          name: data.name,
          shortDesc: data.shortDesc,
          longDesc: data.longDesc,
          imageUrl: data.imageUrl || null,
          terms: data.terms ?? [],
          startDate: data.startDate,
          endDate: data.endDate,
          promoStatus: data.promoStatus,
        },
      });
      return Response.json(item);
    }

    if (type === 'announcement') {
      const item = await prisma.announcement.update({
        where: { id },
        data: {
          title: data.title,
          summary: data.summary,
          content: data.content,
          outlet: data.outlet,
          pinned: data.pinned,
          datePosted: data.datePosted,
        },
      });
      return Response.json(item);
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    console.error('[api/updates PUT]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/updates ──────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!id || !type) return Response.json({ error: 'type and id are required' }, { status: 400 });

    if (type === 'newMenu') {
      await prisma.newMenu.delete({ where: { id } });
    } else if (type === 'promo') {
      await prisma.promo.delete({ where: { id } });
    } else if (type === 'announcement') {
      await prisma.announcement.delete({ where: { id } });
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[api/updates DELETE]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
