import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const sessionId = (await cookies()).get('rr_admin_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { admin: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    // Fetch cashier permissions
    const permRow = await prisma.cashierPermission.findUnique({
      where: { id: 'singleton' },
    });

    const permissions = permRow?.permissions as Record<string, boolean> || {};

    return NextResponse.json({
      admin: {
        id: session.admin.id,
        username: session.admin.username,
        role: session.admin.role,
      },
      permissions,
    });
  } catch (error) {
    console.error('Admin Me API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
