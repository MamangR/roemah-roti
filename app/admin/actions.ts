'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const sessionId = (await cookies()).get('rr_session')?.value;
  if (!sessionId) {
    throw new Error('Unauthorized');
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { member: true } });
  if (!session || new Date() > session.expiresAt) {
    throw new Error('Unauthorized');
  }

  // In a real app, check if session.member.role === 'ADMIN'
  return session.member;
}
export async function getDashboardStats(startDateStr: string, endDateStr: string) {
  await checkAdmin();

  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T23:59:59Z');

  const members = await prisma.member.findMany({
    where: { createdAt: { gte: start, lte: end } }
  });
  const totalMembers = await prisma.member.count();

  const activeMembers = await prisma.activity.groupBy({
    by: ['memberId'],
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
    }
  });

  const activities = await prisma.activity.findMany({
    where: { createdAt: { gte: start, lte: end } }
  });

  const rewardsRedeemed = await prisma.memberReward.count({
    where: { redeemedAt: { not: null }, updatedAt: { gte: start, lte: end } }
  });

  const totalVisits = activities.filter(a => a.type === 'visit').length;

  // Since we don't have POS yet, we'll mock the revenue / top products based on visits
  // Let's pretend every visit = 1 transaction of Rp. 100,000 average
  const memberTxnSum = totalVisits;
  const nonMemberTxnSum = Math.floor(memberTxnSum * 0.4); // Mock 40% non-members
  const transactions = memberTxnSum + nonMemberTxnSum;
  const aov = 125000;
  const revenueSum = transactions * aov;

  return {
    totalMembers,
    newMembersSum: members.length,
    activeMembers: activeMembers.length,
    totalVisits,
    rewardsRedeemed,
    memberTxnSum,
    nonMemberTxnSum,
    transactions,
    revenueSum,
    aov
  };
}

export async function getMembers() {
  await checkAdmin();
  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      activities: { orderBy: { createdAt: 'desc' } }
    }
  });

  return members.map(m => {
    // Determine last activity date
    const lastActivity = m.activities.length > 0 ? m.activities[0].createdAt.toISOString().slice(0, 10) : m.createdAt.toISOString().slice(0, 10);

    // Map transactions (mocked for now since we don't have POS)
    const transactions = m.activities.filter(a => a.type === 'visit').map((a, i) => ({
      date: a.createdAt.toISOString().slice(0, 10),
      invoice: `INV-${new Date(a.createdAt).getFullYear().toString().slice(-2)}${String(new Date(a.createdAt).getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      total: 100000 + Math.floor(Math.random() * 50000),
      visitEarned: 1
    }));

    return {
      id: m.id,
      name: m.name,
      memberId: m.referralCode, // Using referralCode as member ID visually for now
      wa: m.phone,
      status: m.status,
      visits: m.totalVisits,
      spending: transactions.reduce((sum, t) => sum + t.total, 0),
      joinDate: m.createdAt.toISOString().slice(0, 10),
      lastActivity,
      transactions
    };
  });
}

export async function getSystemReward(id: string, defaultName: string, defaultDesc: string, defaultReq: number) {
  const config = await prisma.rewardTemplate.findUnique({ where: { id }, include: { menuItem: true } });
  if (config) {
    return {
      ...config,
      resolvedName: config.name || config.menuItem?.name || defaultName,
      resolvedDesc: config.desc || config.menuItem?.shortDesc || defaultDesc,
      imageUrl: config.menuItem?.imageUrl
    };
  }
  return {
    id,
    name: defaultName,
    desc: defaultDesc,
    visitsRequired: defaultReq,
    status: 'Aktif',
    validityDays: 30,
    menuItemId: null,
    menuItem: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedName: defaultName,
    resolvedDesc: defaultDesc,
    imageUrl: null as string | null
  };
}

export async function saveMember(id: string, data: { name: string; wa: string; status: string; visits: number }) {
  await checkAdmin();
  
  const oldMember = await prisma.member.findUnique({ where: { id } });
  const visitConfig = await getSystemReward('SYSTEM_VISIT', 'Free Garlic Cream Cheese', 'Selamat! Kunjungan Anda telah mencapai target.', 10);
  const threshold = visitConfig.visitsRequired || 10;

  await prisma.member.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.wa,
      status: data.status,
      totalVisits: data.visits
    }
  });

  if (oldMember && data.visits > oldMember.totalVisits) {
    // If this is their first visit(s), auto-approve any pending referral
    if (oldMember.totalVisits === 0 && data.visits > 0) {
      const pendingReferral = await prisma.referredFriend.findFirst({
        where: { friendName: oldMember.name, status: 'Pending' }
      });
      if (pendingReferral) {
        // Auto-approve! This adds the bonus to the referrer.
        await approveReferralAdmin(pendingReferral.id);
      }
    }

    const oldTier = Math.floor(oldMember.totalVisits / threshold);
    const newTier = Math.floor(data.visits / threshold);
    const rewardsEarned = newTier - oldTier;
    
    if (rewardsEarned > 0) {
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rewardsEarned; i++) {
          const reward = await tx.memberReward.create({
            data: {
              memberId: id,
              sourceTemplateId: visitConfig.id,
              rewardType: 'VISIT_' + threshold + '_' + Date.now() + '_' + i,
              title: visitConfig.resolvedName,
              type: 'Reward',
              description: visitConfig.resolvedDesc,
              redeemedAt: null,
              isAvailable: true,
              expiresAtLabel: 'Valid for ' + (visitConfig.validityDays || 30) + ' days'
            }
          });
          
          await tx.activity.create({
            data: {
              memberId: id,
              memberRewardId: reward.id,
              type: 'earned',
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              reward: visitConfig.resolvedName,
              earnedVia: 'Visit Milestone',
              status: 'ready'
            }
          });
        }
      });
    }
  }

  return { success: true };
}

export async function createMemberAdmin(data: { name: string; wa: string }) {
  await checkAdmin();
  let formattedPhone = data.wa.replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
  else if (!formattedPhone.startsWith('62')) formattedPhone = '62' + formattedPhone;

  const exists = await prisma.member.findUnique({ where: { id: formattedPhone } });
  if (exists) throw new Error('Phone number already registered');

  const firstName = data.name.trim().split(' ')[0];
  const initials = firstName.substring(0, 1).toUpperCase();
  const phoneDisplay = `+62 ${formattedPhone.slice(2, 5)} ${formattedPhone.slice(5, 9)} ${formattedPhone.slice(9)}`;
  const since = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const userReferralCode = `${firstName.toUpperCase().replace(/[^A-Z]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  await prisma.member.create({
    data: {
      id: formattedPhone,
      name: data.name.trim(),
      firstName,
      initials,
      phone: phoneDisplay,
      rawPhone: formattedPhone,
      birthday: '',
      birthdayInput: '',
      since,
      referralCode: userReferralCode,
      status: 'Active'
    }
  });
  return { success: true };
}

// -- REWARDS ACTIONS --

export async function getMenuItemsAdmin() {
  await checkAdmin();
  return await prisma.newMenu.findMany({ orderBy: { name: 'asc' } });
}

export async function getRewardsAdmin() {
  await checkAdmin();
  return await prisma.rewardTemplate.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function saveReward(data: { id: string, name: string | null, desc: string | null, visitsRequired: number, status: string, validityDays: number | null, menuItemId: string | null }) {
  await checkAdmin();

  await prisma.rewardTemplate.upsert({
    where: { id: data.id },
    update: {
      name: data.name,
      desc: data.desc,
      visitsRequired: data.visitsRequired,
      status: data.status,
      validityDays: data.validityDays,
      menuItemId: data.menuItemId
    },
    create: {
      id: data.id,
      name: data.name,
      desc: data.desc,
      visitsRequired: data.visitsRequired,
      status: data.status,
      validityDays: data.validityDays,
      menuItemId: data.menuItemId
    }
  });

  return { success: true };
}

export async function deleteReward(id: string) {
  await checkAdmin();
  await prisma.rewardTemplate.deleteMany({ where: { id } });
  return { success: true };
}

export async function redeemRewardAdmin(memberId: string, rewardTemplateId: string) {
  await checkAdmin();
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  const template = await prisma.rewardTemplate.findUnique({
    where: { id: rewardTemplateId },
    include: { menuItem: true }
  });

  if (!member || !template) throw new Error('Not found');
  if (member.totalVisits < template.visitsRequired) throw new Error('Not enough visits');

  const redeemedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const newReward = await tx.memberReward.create({
      data: {
        memberId: member.id,
        rewardType: template.id + '_' + Date.now(), // unique type so multiple can be issued
        title: template.name || template.menuItem?.name || 'Reward',
        type: 'Admin Redeemed',
        description: template.desc || template.menuItem?.shortDesc || '',
        redeemedAt,
        isAvailable: false
      }
    });

    await tx.activity.create({
      data: {
        memberId: member.id,
        memberRewardId: newReward.id,
        type: 'redeemed',
        date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        outlet: 'Roemah Roti',
        reward: template.name || template.menuItem?.name || 'Reward',
        ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`
      }
    });

    await tx.member.update({
      where: { id: memberId },
      data: {
        rewardsEarned: { increment: 1 }
      }
    });

    await handleRedemptionVisit(tx, memberId, member.totalVisits, 1 - template.visitsRequired, redeemedAt);
  });

  return { success: true };
}

export async function getHistoryAdmin() {
  await checkAdmin();
  const rewards = await prisma.memberReward.findMany({
    where: { redeemedAt: { not: null } },
    include: { member: true },
    orderBy: { redeemedAt: 'desc' }
  });

  return rewards.map(r => ({
    id: r.id,
    memberName: r.member.name,
    memberId: r.member.referralCode,
    rewardName: r.title,
    dateLabel: r.redeemedAt ? r.redeemedAt.toISOString().slice(0, 10) : '',
    outlet: r.location
  }));
}

// -- REFERRALS ACTIONS --

export async function getReferralsAdmin() {
  await checkAdmin();
  
  // Fetch referrals with the referrer and the formally linked friend
  const friends = await prisma.referredFriend.findMany({
    include: { referrer: true, friend: true },
    orderBy: { createdAt: 'desc' }
  });

  const referralConfig = await getSystemReward('SYSTEM_REFERRAL', 'Free Garlic Cream Cheese', 'Our thanks for a friend who joined.', 1);

  const flatList: any[] = [];
  for (const f of friends) {
    flatList.push({
      id: f.id,
      referralId: f.id,
      referrerName: f.referrer.name,
      referrerKey: f.referrer.id,
      referrerJoinDate: f.referrer.createdAt.toISOString().slice(0, 10),
      referrerWa: f.referrer.phone,
      referrerMemberId: f.referrer.referralCode,
      referredName: f.friendName,
      referredRegisterDate: f.friend ? f.friend.createdAt.toISOString().slice(0, 10) : '-',
      referredMemberId: f.friend ? f.friend.referralCode : '-',
      referredVisitDone: f.friend ? f.friend.totalVisits > 0 : false,
      date: f.date || f.createdAt.toISOString().slice(0, 10),
      status: f.status,
      rewardName: referralConfig.resolvedName
    });
  }
  return flatList;
}

export async function approveReferralAdmin(friendId: string) {
  await checkAdmin();
  const f = await prisma.referredFriend.findUnique({ where: { id: friendId }, include: { referrer: true } });
  if (!f) throw new Error('Not found');

  await prisma.referredFriend.update({
    where: { id: friendId },
    data: { status: 'Approved' }
  });
  return { success: true };
}

export async function rejectReferralAdmin(friendId: string) {
  await checkAdmin();
  await prisma.referredFriend.update({
    where: { id: friendId },
    data: { status: 'Rejected' }
  });
  return { success: true };
}

export async function handleRedemptionVisit(tx: any, memberId: string, oldVisits: number, visitsDiff: number, redeemedAt: Date) {
  const visitConfig = await tx.rewardTemplate.findUnique({
    where: { id: 'SYSTEM_VISIT' },
    include: { menuItem: true }
  });
  const threshold = visitConfig?.visitsRequired || 10;
  const newVisits = oldVisits + visitsDiff;

  await tx.member.update({
    where: { id: memberId },
    data: { totalVisits: newVisits }
  });

  await tx.activity.create({
    data: {
      memberId,
      type: 'visit',
      date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      outlet: 'Roemah Roti',
      visitNo: `Visit #${newVisits}`
    }
  });

  const baseForOldTier = visitsDiff < 0 ? oldVisits + (visitsDiff - 1) : oldVisits;
  const oldTier = Math.floor(baseForOldTier / threshold);
  const newTier = Math.floor(newVisits / threshold);
  const rewardsEarned = newTier - oldTier;

  if (rewardsEarned > 0 && visitConfig) {
    const resolvedName = visitConfig.name || visitConfig.menuItem?.name || 'Free Garlic Cream Cheese';
    const resolvedDesc = visitConfig.desc || visitConfig.menuItem?.shortDesc || 'Selamat! Kunjungan Anda telah mencapai target.';

    for (let i = 0; i < rewardsEarned; i++) {
      const reward = await tx.memberReward.create({
        data: {
          memberId,
          sourceTemplateId: visitConfig.id,
          rewardType: 'VISIT_' + threshold + '_' + Date.now() + '_' + i,
          title: resolvedName,
          type: 'Reward',
          description: resolvedDesc,
          redeemedAt: null,
          isAvailable: true,
          expiresAtLabel: 'Valid for ' + (visitConfig.validityDays || 30) + ' days'
        }
      });
      
      await tx.activity.create({
        data: {
          memberId,
          memberRewardId: reward.id,
          type: 'earned',
          date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          reward: resolvedName,
          earnedVia: 'Visit Milestone',
          status: 'ready'
        }
      });
    }
  }
}

