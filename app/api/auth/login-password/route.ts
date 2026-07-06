import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Identify user by either formatted phone or referralCode (Member ID)
    let formattedPhone = identifier.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (formattedPhone.length > 5 && !formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { id: formattedPhone },
          { referralCode: identifier.toUpperCase() }
        ]
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    if (!member.password) {
      return NextResponse.json({ error: 'No password set for this account. Please log in with OTP.' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
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
    console.error('Login Password API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
