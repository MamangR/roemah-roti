import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const sessionId = (await cookies()).get('rr_admin_session')?.value;
  if (!sessionId) return false;
  const session = await prisma.adminSession.findUnique({ where: { id: sessionId }, include: { admin: true } });
  return session && session.expiresAt > new Date();
}

export async function GET() {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mappings = await prisma.storeMapping.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(mappings);
}

export async function POST(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, posId } = await req.json();
  const mapping = await prisma.storeMapping.create({ data: { name, posId } });
  return NextResponse.json(mapping);
}

export async function PUT(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, posId } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const mapping = await prisma.storeMapping.update({
    where: { id },
    data: { name, posId }
  });
  return NextResponse.json(mapping);
}

export async function DELETE(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await prisma.storeMapping.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
