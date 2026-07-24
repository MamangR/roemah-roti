import { prisma } from './prisma';
import { fetchAccurate } from './accurate';

export async function syncPendingPosTransactions() {
  // Find all activities that are waiting for POS sync
  const pendingActivities = await prisma.activity.findMany({
    where: { status: 'Pending POS', type: 'visit' },
    orderBy: { createdAt: 'asc' },
    include: { member: true }
  });

  if (pendingActivities.length === 0) {
    return { syncedCount: 0, pendingCount: 0 };
  }

  // Get the earliest pending activity date to know how far back to fetch from Accurate
  const earliestActivityDate = new Date(pendingActivities[0].createdAt);
  
  // We subtract 1 hour to account for potential clock skew or minor delays
  const fromIso = new Date(earliestActivityDate.getTime() - 60 * 60 * 1000).toISOString().split('T')[0];
  const toIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let url = '/accurate/api/sales-invoice/list.do';
  let receipts: any[] = [];
  let page = 1;
  const pageSize = 100;

  // Fetch recent sales invoices
  while (true) {
    const params: any = {
      fields: 'id,number,transDate,totalAmount,customer',
      'sp.page': page,
      'sp.pageSize': pageSize,
      'filter.transDate.op': 'BETWEEN',
      'filter.transDate.val': `${fromIso};${toIso}`
    };

    const res = await fetchAccurate(url, params);
    if (!res || !res.d) break;

    receipts = receipts.concat(res.d);
    if (res.sp && res.sp.page < res.sp.pageCount) page++;
    else break;
  }

  // Parse receipt dates correctly and sort chronologically
  const parsedReceipts = receipts.map(r => {
    let rDate = new Date();
    if (typeof r.transDate === 'string' && r.transDate.includes('/')) {
        const parts = r.transDate.split(/[\s/:]+/);
        if (parts.length >= 3) {
            rDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${parts[3] || '12'}:${parts[4] || '00'}:00Z`);
        } else {
            rDate = new Date(r.transDate);
        }
    } else {
        rDate = new Date(r.transDate);
    }
    return { ...r, parsedDate: rDate };
  }).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  let syncedCount = 0;

  for (const activity of pendingActivities) {
    // We look for the first Accurate transaction that occurs AFTER this activity was created
    // We also give a 2-minute buffer BEFORE the activity creation just in case the cashier
    // rang it up slightly before marking it as redeemed on the iPad.
    const activityTime = new Date(activity.createdAt).getTime();
    
    // Find the nearest receipt
    const match = parsedReceipts.find(r => {
      const receiptTime = r.parsedDate.getTime();
      return receiptTime >= (activityTime - 2 * 60 * 1000) && !r._matched;
    });

    if (match) {
      match._matched = true; // prevent double matching

      // Link the activity
      await prisma.$transaction(async (tx) => {
        // 1. Update the Activity
        await tx.activity.update({
          where: { id: activity.id },
          data: {
            status: 'Completed',
            posTransactionId: match.id.toString(),
            ref: match.number || `INV-${match.id}`,
            amount: match.totalAmount,
            date: match.parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: match.parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
        });

        // 2. Update Member (Increment Visit + Lifetime Spend + adjust Tier)
        const newVisits = activity.member.totalVisits + 1;
        const newSpend = activity.member.lifetimeSpend + Math.floor(match.totalAmount || 0);
        
        await tx.member.update({
          where: { id: activity.memberId },
          data: {
            totalVisits: newVisits,
            lifetimeSpend: newSpend
          }
        });
      });

      syncedCount++;
    }
  }

  return { syncedCount, pendingCount: pendingActivities.length - syncedCount };
}
