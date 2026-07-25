import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAccurate } from '@/lib/accurate';

// Global variable to prevent Accurate POS API overload when multiple users poll simultaneously
let lastSyncTime = 0;

export async function GET(req: Request) {
  try {
    // Throttle: Only actually hit Accurate POS a maximum of once every 10 seconds, regardless of how many users are polling
    if (Date.now() - lastSyncTime < 10000) {
      return NextResponse.json({ message: 'Sync skipped (throttled)', newPurchasesCount: 0 });
    }
    lastSyncTime = Date.now();

    let url = '/accurate/api/sales-invoice/list.do'; 
    let receipts: any[] = [];
    let page = 1;
    const pageSize = 100;
    
    // Fetch recent 500 transactions (5 pages)
    // Accurate usually orders by date descending by default, or we can just fetch
    while (page <= 5) {
      const params: any = {
        fields: 'id,number,transDate,totalAmount,customer',
        'sp.sort.id': 'desc',
        'sp.page': page,
        'sp.pageSize': pageSize
      };
      
      const res = await fetchAccurate(url, params);
      if (!res || !res.d || res.d.length === 0) break;
      
      receipts = receipts.concat(res.d);
      
      if (res.sp && res.sp.page < res.sp.pageCount) {
        page++;
      } else {
        break;
      }
    }

    let processedCount = 0;
    let newPurchasesCount = 0;
    
    // Cache for customer ID to phone number mappings
    const customerIdToPhoneMap: Record<number, string> = {};

    for (const receipt of receipts) {
      if (!receipt.customer || !receipt.customer.id) continue;
      
      const customerId = receipt.customer.id;
      let phone = receipt.customer.no || receipt.customer.customerNo || receipt.customer.mobilePhone;
      
      // If the invoice endpoint didn't return the phone, we look it up from Accurate's customer endpoint
      if (!phone) {
        if (customerIdToPhoneMap[customerId]) {
          phone = customerIdToPhoneMap[customerId];
        } else {
          try {
            const custRes = await fetchAccurate('/accurate/api/customer/list.do', {
              'filter.id.op': 'EQUAL',
              'filter.id.val': customerId,
              fields: 'id,customerNo,mobilePhone'
            });
            if (custRes && custRes.d && custRes.d.length > 0) {
              const matchedCustomer = custRes.d[0];
              phone = matchedCustomer.customerNo || matchedCustomer.mobilePhone;
              if (phone) customerIdToPhoneMap[customerId] = phone;
            }
          } catch (err) {
            console.error('Failed to fetch customer phone from Accurate:', err);
          }
        }
      }

      if (!phone) continue; // Still couldn't find the phone number
      
      // Look up member
      const member = await prisma.member.findUnique({ where: { id: phone } });
      if (!member) continue; // Not a registered member

      const refNumber = receipt.number;
      const amount = receipt.totalAmount || 0;
      
      // Check if this transaction is already recorded
      const existingActivity = await prisma.activity.findFirst({
        where: { ref: refNumber, type: 'visit' }
      });

      if (!existingActivity) {
        // Record the new purchase
        let isoDate = new Date().toISOString().slice(0, 10);
        if (receipt.transDate) {
          if (receipt.transDate.includes('/')) {
             const parts = receipt.transDate.split(/[\s/:]+/);
             if (parts.length >= 3) {
                isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
             }
          } else {
             const d = new Date(receipt.transDate);
             if (!isNaN(d.getTime())) isoDate = d.toISOString().slice(0, 10);
          }
        }
        
        // Check if there is already a visit today
        const startOfDay = new Date(isoDate + 'T00:00:00.000Z');
        const endOfDay = new Date(isoDate + 'T23:59:59.999Z');
        
        // Count existing visits BEFORE we insert this new one
        const visitsTodayCount = await prisma.activity.count({
          where: { 
            memberId: member.id, 
            type: { in: ['visit', 'manual_visit'] },
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        });

        const isFirstVisitToday = visitsTodayCount === 0;
        
        let purchasedItemName = 'Transaction';
        if (receipt.detailItem && receipt.detailItem.length > 0 && receipt.detailItem[0].item) {
           purchasedItemName = receipt.detailItem[0].item.name || 'Transaction';
           if (receipt.detailItem.length > 1) purchasedItemName += ` and ${receipt.detailItem.length - 1} more items`;
        }
        
        await prisma.activity.create({
          data: {
            memberId: member.id,
            type: 'visit',
            date: isoDate,
            amount: amount,
            ref: refNumber,
            reward: purchasedItemName,
            status: isFirstVisitToday ? 'visit_earned' : 'no_visit'
          }
        });

        // Update member spend and visits
        await prisma.member.update({
          where: { id: member.id },
          data: {
            lifetimeSpend: { increment: amount },
            ...(isFirstVisitToday ? { totalVisits: { increment: 1 } } : {})
          }
        });
        
        newPurchasesCount++;
      }
      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      processedCount, 
      newPurchasesCount 
    });
  } catch (error) {
    console.error('Sync Spend Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
