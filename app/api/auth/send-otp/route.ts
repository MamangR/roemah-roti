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

    const META_WA_ACCESS_TOKEN = process.env.META_WA_ACCESS_TOKEN;
    const META_WA_PHONE_NUMBER_ID = process.env.META_WA_PHONE_NUMBER_ID;

    if (!META_WA_ACCESS_TOKEN || !META_WA_PHONE_NUMBER_ID) {
      console.error('WhatsApp API credentials are missing in environment variables');
      return NextResponse.json({ error: 'WhatsApp API credentials are not configured' }, { status: 500 });
    }

    // Try sending message via official Meta WhatsApp Cloud API
    // Note: If you are outside the 24-hour customer service window,
    // you must use an approved WhatsApp template instead of a standard text message.
    const response = await fetch(`https://graph.facebook.com/v19.0/${META_WA_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: `*Roemah Roti*\nYour login code is: ${code}\nThis code expires in 5 minutes.`
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API Error:', result);
      return NextResponse.json({ error: 'Failed to send WhatsApp message via Meta API', details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
