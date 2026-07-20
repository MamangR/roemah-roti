import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
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

    if (session.admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
    }

    const rows = await prisma.uiTextOverride.findMany();
    const overrides: Record<string, string> = {};
    for (const row of rows) {
      overrides[row.key] = row.value;
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('UI Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (session.admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
    }

    const { overrides } = await req.json();

    if (!overrides || typeof overrides !== 'object') {
      return NextResponse.json({ error: 'Invalid overrides payload' }, { status: 400 });
    }

    // Upsert each override; delete keys whose value matches empty string (reset to default)
    const ops = Object.entries(overrides).map(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return prisma.uiTextOverride.deleteMany({ where: { key } });
      }
      return prisma.uiTextOverride.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    });

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UI Settings PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
