import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const sessionId = (await cookies()).get('rr_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        member: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' }
            },
            rewards: true,
            referredFriends: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!session || new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    // Return the member profile (include birthdayInput for birthday reward logic)
    return NextResponse.json({ member: session.member });
  } catch (error) {
    console.error('API /user/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
