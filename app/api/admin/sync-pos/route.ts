import { NextResponse } from 'next/server';
import { syncPendingPosTransactions } from '@/lib/accurate-sync';

export async function POST() {
  try {
    const result = await syncPendingPosTransactions();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Failed to sync POS:', err);
    return NextResponse.json({ success: false, error: 'Failed to sync' }, { status: 500 });
  }
}

export async function GET() {
  // Allow GET for easy manual testing/cron execution
  try {
    const result = await syncPendingPosTransactions();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Failed to sync POS:', err);
    return NextResponse.json({ success: false, error: 'Failed to sync' }, { status: 500 });
  }
}
