import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestLog = await prisma.syncLog.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestLog) {
      return NextResponse.json({ success: true, log: null });
    }

    return NextResponse.json({ success: true, log: latestLog });
  } catch (error: any) {
    console.error('Error fetching sync-log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
