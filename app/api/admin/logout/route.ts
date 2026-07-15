import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const sessionId = (await cookies()).get('rr_admin_session')?.value;

    if (sessionId) {
      // Delete the session from DB
      await prisma.adminSession.deleteMany({ where: { id: sessionId } });
    }

    // Clear the cookie
    (await cookies()).delete('rr_admin_session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Logout API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
