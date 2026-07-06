import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const referrer = await prisma.member.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true }
    });

    if (referrer) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error('Check Referral API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
