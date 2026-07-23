import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAccurate } from '@/lib/accurate';

export async function POST(req: Request) {
  try {
    // 1. Fetch items from Accurate POS
    const url = '/accurate/api/item/list.do';
    const params = {
      fields: 'id,name,no,itemType,unitPrice,itemCategory'
    };

    const res = await fetchAccurate(url, params);
    if (!res || !res.d) {
      return NextResponse.json({ success: false, error: 'Failed to fetch items from Accurate POS' }, { status: 500 });
    }

    const items = res.d;
    let syncedCount = 0;
    let failedCount = 0;
    let deletedCount = 0;

    const todayIso = new Date().toISOString().slice(0, 10);
    const validSkus: string[] = [];

    for (const item of items) {
      // Only sync INVENTORY or NON_INVENTORY items
      if (item.itemType !== 'INVENTORY' && item.itemType !== 'NON_INVENTORY') {
        continue;
      }

      const sku = item.no;
      const name = item.name || 'Unknown Item';
      const price = item.unitPrice || 0;
      const category = item.itemCategory?.name || 'Uncategorized';

      if (!sku) {
        failedCount++;
        continue;
      }

      validSkus.push(sku);

      try {
        await prisma.newMenu.upsert({
          where: { sku: sku },
          update: {
            name: name,
            price: price,
            category: category,
          },
          create: {
            sku: sku,
            name: name,
            price: price,
            category: category,
            shortDesc: '',
            longDesc: '',
            status: 'Published',
            dateAdded: todayIso,
          }
        });
        syncedCount++;
      } catch (dbErr) {
        console.error(`Failed to upsert item ${sku}:`, dbErr);
        failedCount++;
      }
    }

    if (validSkus.length > 0) {
      const missingItems = await prisma.newMenu.findMany({
        where: {
          sku: { not: null },
          NOT: { sku: { in: validSkus } }
        },
        select: { id: true, sku: true, rewardTemplates: true }
      });

      for (const item of missingItems) {
        try {
          if (item.rewardTemplates && item.rewardTemplates.length > 0) {
            for (const rt of item.rewardTemplates) {
              if (rt.id.startsWith('SYSTEM_')) {
                await prisma.rewardTemplate.update({ where: { id: rt.id }, data: { menuItemId: null } });
              } else {
                await prisma.rewardTemplate.delete({ where: { id: rt.id } });
              }
            }
          }
          await prisma.newMenu.delete({ where: { id: item.id } });
          deletedCount++;
        } catch (delErr) {
          console.warn(`Could not delete missing item ${item.sku} (likely in use):`, delErr);
        }
      }
    }

    await prisma.syncLog.create({
      data: {
        syncedCount,
        failedCount
      }
    });

    return NextResponse.json({ success: true, syncedCount, failedCount, deletedCount });
  } catch (error: any) {
    console.error('Error in sync-products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
