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

  const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, body } = await req.json();
  const template = await prisma.messageTemplate.create({ data: { name, body } });
  return NextResponse.json(template);
}

export async function PUT(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, body } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: { name, body }
  });
  return NextResponse.json(template);
}

export async function DELETE(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await prisma.messageTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
