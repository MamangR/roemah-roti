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

  let setting = await prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
  if (!setting) {
    setting = await prisma.systemSetting.create({
      data: { id: 'singleton', posConnected: true, waConnected: true }
    });
  }

  return NextResponse.json({ setting });
}

export async function PUT(req: Request) {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { posConnected, waConnected } = data;

  const setting = await prisma.systemSetting.upsert({
    where: { id: 'singleton' },
    update: { posConnected, waConnected },
    create: { id: 'singleton', posConnected: posConnected ?? true, waConnected: waConnected ?? true },
  });

  return NextResponse.json({ setting });
}
