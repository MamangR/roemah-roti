import { NextResponse } from 'next/server';

// This route handles Webhook verification and incoming message events from Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Meta sends these query params for verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WA_VERIFY_TOKEN;

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      // Respond with the challenge token from the request
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp status update or incoming message
    if (body.object === 'whatsapp_business_account') {
      // You can process incoming messages or message delivery statuses here in the future
      console.log('Received WhatsApp Webhook Event:', JSON.stringify(body, null, 2));
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
