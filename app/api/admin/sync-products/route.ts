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

    const todayIso = new Date().toISOString().slice(0, 10);

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
            status: 'Draft',
            dateAdded: todayIso,
          }
        });
        syncedCount++;
      } catch (dbErr) {
        console.error(`Failed to upsert item ${sku}:`, dbErr);
        failedCount++;
      }
    }

    return NextResponse.json({ success: true, syncedCount, failedCount });
  } catch (error: any) {
    console.error('Error in sync-products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
