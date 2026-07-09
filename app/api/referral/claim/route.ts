import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const sessionId = (await cookies()).get('rr_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { member: { include: { referredFriends: true, rewards: true } } }
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = session.member;

    const referralConfig = await prisma.rewardTemplate.findUnique({ where: { id: 'SYSTEM_REFERRAL' } });
    const goalCount = referralConfig ? referralConfig.visitsRequired : 1;
    const rewardName = referralConfig ? referralConfig.name : 'Free Garlic Cream Cheese';
    const rewardDesc = referralConfig ? referralConfig.desc : 'Our thanks for a friend who joined.';

    // Check if they have at least 1 Approved referred friend
    const qualifyingFriends = member.referredFriends.filter(f => f.status === 'Approved');
    if (qualifyingFriends.length < goalCount) {
      return NextResponse.json({ error: 'Not enough qualifying friends' }, { status: 400 });
    }

    // Check if they already claimed the referral reward
    const hasClaimed = member.rewards.some(r => r.type === 'Referral' && r.title.includes(rewardName));
    if (hasClaimed) {
      return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 });
    }

    // Calculate expiry date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const expiresAtLabel = 'Expires ' + expiryDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    // Create the reward
    await prisma.memberReward.create({
      data: {
        memberId: member.id,
        rewardType: 'ref_garlic_cream_cheese_' + Date.now(),
        title: rewardName,
        type: 'Referral',
        description: rewardDesc,
        isAvailable: true,
        expiresAtLabel,
        isOneTimeUse: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Claim Referral API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
