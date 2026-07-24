import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const sessionId = (await cookies()).get('rr_admin_session')?.value;
  if (!sessionId) return false;
  const session = await prisma.adminSession.findUnique({ where: { id: sessionId }, include: { admin: true } });
  return session && session.expiresAt > new Date();
}

export async function POST() {
  const authorized = await checkAdmin();
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: { posConnected: false },
      create: { id: 'singleton', posConnected: false }
    });
    
    await prisma.syncLog.create({
      data: { type: 'connection', status: 'Disconnected' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting POS:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
