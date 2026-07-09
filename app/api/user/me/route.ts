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

    // Check and update referred friends' status dynamically
    const mappedFriends = await Promise.all(
      session.member.referredFriends.map(async (f) => {
        if (f.status === 'Pending') {
          const friendMember = await prisma.member.findFirst({ where: { name: f.friendName } });
          if (friendMember && friendMember.totalVisits > 0) {
            // Optionally update DB
            await prisma.referredFriend.update({ where: { id: f.id }, data: { status: 'Approved' } });
            return { ...f, status: 'Approved' };
          }
        }
        return f;
      })
    );

    // Return the member profile
    return NextResponse.json({ 
      member: { 
        ...session.member, 
        referredFriends: mappedFriends 
      } 
    });
  } catch (error) {
    console.error('API /user/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
