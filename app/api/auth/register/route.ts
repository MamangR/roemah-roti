import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { phone, name, birthdayInput, referralCode, password } = await req.json();
    
    if (!phone || !name || !birthdayInput || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    // Check if member already exists
    let member = await prisma.member.findUnique({ where: { id: formattedPhone } });
    if (member) {
      return NextResponse.json({ error: 'Phone number already registered. Please log in.' }, { status: 400 });
    }
      // Create new member
      const firstName = name.trim().split(' ')[0];
      const initials = firstName.substring(0, 1).toUpperCase();
      const phoneDisplay = `+62 ${formattedPhone.slice(2, 5)} ${formattedPhone.slice(5, 9)} ${formattedPhone.slice(9)}`;
      
      let bDate = new Date(birthdayInput);
      if (isNaN(bDate.getTime())) bDate = new Date();
      const birthdayDisplay = bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const since = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const userReferralCode = `${firstName.toUpperCase().replace(/[^A-Z]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      let hashedPassword = null;
      if (password && password.length >= 6) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      member = await prisma.member.create({
        data: {
          id: formattedPhone,
          name: name.trim(),
          firstName,
          initials,
          phone: phoneDisplay,
          rawPhone: formattedPhone,
          password: hashedPassword,
          birthday: birthdayDisplay,
          birthdayInput,
          since,
          referralCode: userReferralCode,
        }
      });
      
      if (referralCode) {
        const referrer = await prisma.member.findUnique({ where: { referralCode } });
        if (referrer) {
          // Ensure the referrer has a Referral record so they appear in admin panel
          let referral = await prisma.referral.findUnique({ where: { memberId: referrer.id } });
          if (!referral) {
            referral = await prisma.referral.create({
              data: {
                memberId: referrer.id,
                code: referrer.referralCode,
              }
            });
          }
          
          // Add the newly registered member as a ReferredFriend
          await prisma.referredFriend.create({
            data: {
              referrerId: referrer.id,
              friendId: member.id,
              friendName: member.name,
              date: new Date().toISOString().slice(0, 10),
              status: 'Pending',
              contribution: '+1'
            }
          });
        }
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
    console.error('Register API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
