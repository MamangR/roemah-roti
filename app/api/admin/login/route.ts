import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!adminUser || adminUser.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create session (7 days)
    const session = await prisma.adminSession.create({
      data: {
        adminUserId: adminUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    (await cookies()).set('rr_admin_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Admin Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
