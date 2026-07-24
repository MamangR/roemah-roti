import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAccurate } from '@/lib/accurate';
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
    const res = await fetchAccurate('/accurate/api/branch/list.do');
    
    if (!res || !Array.isArray(res.d)) {
      await prisma.systemSetting.upsert({
        where: { id: 'singleton' },
        update: { posConnected: false },
        create: { id: 'singleton', posConnected: false }
      });
      await prisma.syncLog.create({
        data: { type: 'connection', status: 'Failed, retrying' }
      });
      return NextResponse.json({ success: false, error: 'Failed to connect to accurate pos.' });
    }
    
    const branches = res.d;
    for (const branch of branches) {
      if (branch.id && branch.name) {
        await prisma.storeMapping.upsert({
          where: { posId: branch.id.toString() },
          update: { name: branch.name },
          create: { posId: branch.id.toString(), name: branch.name }
        });
      }
    }
    
    await prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: { posConnected: true },
      create: { id: 'singleton', posConnected: true }
    });
    
    await prisma.syncLog.create({
      data: { type: 'connection', status: 'Success' }
    });
    
    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    console.error('Error connecting POS:', error);
    await prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: { posConnected: false },
      create: { id: 'singleton', posConnected: false }
    });
    await prisma.syncLog.create({
      data: { type: 'connection', status: 'Failed, retrying' }
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
