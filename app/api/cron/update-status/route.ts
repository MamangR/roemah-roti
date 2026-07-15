import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // If deploying to Vercel, you could also verify a secret token here
  // to ensure only the cron job can hit this route.

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find all active members
    const activeMembers = await prisma.member.findMany({
      where: { status: 'Active' },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    let updatedCount = 0;

    for (const member of activeMembers) {
      const lastActivity = member.activities.length > 0 
        ? new Date(member.activities[0].createdAt) 
        : new Date(member.createdAt);

      if (lastActivity < thirtyDaysAgo) {
        await prisma.member.update({
          where: { id: member.id },
          data: { status: 'Inactive' }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
