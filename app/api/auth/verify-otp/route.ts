import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    const otpSession = await prisma.otpSession.findUnique({ where: { phone: formattedPhone } });
    if (!otpSession) {
      return NextResponse.json({ error: 'No OTP session found' }, { status: 400 });
    }

    if (otpSession.attempts >= 3) {
      return NextResponse.json({ error: 'Too many failed attempts. Request a new code.' }, { status: 400 });
    }

    if (new Date() > otpSession.expiresAt) {
      return NextResponse.json({ error: 'OTP expired. Request a new code.' }, { status: 400 });
    }

    if (otpSession.code !== code) {
      await prisma.otpSession.update({
        where: { phone: formattedPhone },
        data: { attempts: otpSession.attempts + 1 }
      });
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // OTP is valid!
    await prisma.otpSession.delete({ where: { phone: formattedPhone } });

    // Look up member
    const member = await prisma.member.findUnique({ where: { id: formattedPhone } });
    
    // If member doesn't exist, they need to register
    if (!member) {
      return NextResponse.json({ error: 'Account not found. Please register first.', requiresRegistration: true }, { status: 404 });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        memberId: member.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Set cookie
    (await cookies()).set('rr_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
