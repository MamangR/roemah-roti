'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Optional: Admin authorization check
async function checkAdmin() {
  const sessionId = (await cookies()).get('rr_session')?.value;
  if (!sessionId) throw new Error('Unauthorized');
  
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { member: true } });
  if (!session || new Date() > session.expiresAt) throw new Error('Unauthorized');
  
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
      invoice: `INV-${new Date(a.createdAt).getFullYear().toString().slice(-2)}${String(new Date(a.createdAt).getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(3,'0')}`,
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

export async function saveMember(id: string, data: { name: string; wa: string; status: string; visits: number }) {
  await checkAdmin();
  await prisma.member.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.wa,
      status: data.status,
      totalVisits: data.visits
    }
  });
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

export async function getRewardsAdmin() {
  await checkAdmin();
  return await prisma.rewardTemplate.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function saveReward(data: { id: string, name: string, desc: string, visitsRequired: number, status: string, expiryDate?: string | null }) {
  await checkAdmin();
  
  const expiry = data.expiryDate ? new Date(data.expiryDate) : null;

  if (data.id.startsWith('rw')) {
    // New
    await prisma.rewardTemplate.create({
      data: {
        name: data.name,
        desc: data.desc,
        visitsRequired: data.visitsRequired,
        status: data.status,
        expiryDate: expiry
      }
    });
  } else {
    // Update
    await prisma.rewardTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        desc: data.desc,
        visitsRequired: data.visitsRequired,
        status: data.status,
        expiryDate: expiry
      }
    });
  }
  return { success: true };
}

export async function deleteReward(id: string) {
  await checkAdmin();
  await prisma.rewardTemplate.delete({ where: { id } });
  return { success: true };
}

export async function redeemRewardAdmin(memberId: string, rewardTemplateId: string) {
  await checkAdmin();
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  const template = await prisma.rewardTemplate.findUnique({ where: { id: rewardTemplateId } });
  
  if (!member || !template) throw new Error('Not found');
  if (member.totalVisits < template.visitsRequired) throw new Error('Not enough visits');
  
  await prisma.$transaction([
    prisma.member.update({
      where: { id: memberId },
      data: { totalVisits: member.totalVisits - template.visitsRequired }
    }),
    prisma.memberReward.create({
      data: {
        memberId: member.id,
        rewardType: template.id + '_' + Date.now(), // unique type so multiple can be issued
        title: template.name,
        type: 'Admin Redeemed',
        description: template.desc,
        redeemedAt: new Date(),
        isAvailable: false
      }
    })
  ]);
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
  const referrals = await prisma.referral.findMany({
    include: {
      member: {
        include: {
          referredFriends: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const flatList: any[] = [];
  for (const r of referrals) {
    for (const f of r.member.referredFriends) {
      // Find if friend registered (matching by name since phone is not stored in ReferredFriend schema)
      const friendMember = await prisma.member.findFirst({ where: { name: f.friendName } });
      
      flatList.push({
        id: f.id,
        referralId: r.id,
        referrerName: r.member.name,
        referrerKey: r.member.id,
        referrerJoinDate: r.member.createdAt.toISOString().slice(0, 10),
        referrerWa: r.member.phone,
        referrerMemberId: r.member.referralCode,
        referredName: f.friendName,
        referredRegisterDate: friendMember ? friendMember.createdAt.toISOString().slice(0, 10) : '-',
        referredMemberId: friendMember ? friendMember.referralCode : '-',
        referredVisitDone: friendMember ? friendMember.totalVisits > 0 : false,
        date: f.date || f.createdAt.toISOString().slice(0, 10),
        status: f.status,
        rewardName: 'Gratis 5 Kunjungan' // Hardcoded proxy for now
      });
    }
  }
  return flatList;
}

export async function approveReferralAdmin(friendId: string) {
  await checkAdmin();
  const f = await prisma.referredFriend.findUnique({ where: { id: friendId }, include: { referrer: true } });
  if (!f) throw new Error('Not found');
  
  await prisma.$transaction([
    prisma.referredFriend.update({
      where: { id: friendId },
      data: { status: 'Approved' }
    }),
    prisma.member.update({
      where: { id: f.referrerId },
      data: { totalVisits: { increment: 5 } } // Proxy for reward
    }),
    prisma.memberReward.create({
      data: {
        memberId: f.referrerId,
        rewardType: 'REF_BONUS_' + Date.now(),
        title: 'Referral Bonus',
        type: 'Referral',
        description: 'Gratis 5 Kunjungan (Bonus Referral)',
        redeemedAt: new Date(),
        isAvailable: false
      }
    })
  ]);
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

