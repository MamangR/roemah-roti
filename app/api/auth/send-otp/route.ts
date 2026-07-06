import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone to standard international format (e.g. 628...)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert OtpSession in DB
    await prisma.otpSession.upsert({
      where: { phone: formattedPhone },
      update: { code, expiresAt, attempts: 0 },
      create: { phone: formattedPhone, code, expiresAt },
    });

    const LOCAL_WA_API_KEY = process.env.LOCAL_WA_API_KEY || 'roemah_roti_secret_test_key';
    const LOCAL_WA_URL = process.env.LOCAL_WA_URL || 'http://localhost:3001';

    // Try sending message via local whatsapp-web.js gateway
    const response = await fetch(`${LOCAL_WA_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: LOCAL_WA_API_KEY,
        phone: formattedPhone,
        message: `*Roemah Roti*\nYour login code is: ${code}\nThis code expires in 5 minutes.`
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp Gateway Error:', result);
      return NextResponse.json({ error: 'Failed to send WhatsApp message via local gateway', details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
