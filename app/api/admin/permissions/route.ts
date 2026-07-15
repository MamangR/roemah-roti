import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    // Verify admin session
    const sessionId = (await cookies()).get('rr_admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { admin: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Only admins can update permissions
    if (session.admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
    }

    const { permissions } = await req.json();

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid permissions payload' }, { status: 400 });
    }

    // Upsert the singleton permissions row
    await prisma.cashierPermission.upsert({
      where: { id: 'singleton' },
      update: { permissions },
      create: { id: 'singleton', permissions },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Permissions API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
