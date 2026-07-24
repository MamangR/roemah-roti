import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      where: { type: 'connection' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching sync-logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
