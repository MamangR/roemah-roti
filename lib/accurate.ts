import crypto from 'crypto';

function getAccurateTimestamp() {
  // ISO 8601 UTC / GMT is much more robust for avoiding timezone mismatch 600s tolerance
  return new Date().toISOString();
}

function generateSignature(timestamp: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(timestamp);
  return hmac.digest('base64');
}

export async function fetchAccurate(endpoint: string, params: Record<string, string> = {}) {
  const token = process.env.ACCURATE_API_TOKEN;
  const secret = process.env.ACCURATE_SIGNATURE_SECRET;
  let baseUrl = process.env.ACCURATE_BASE_URL || 'https://account.accurate.id';
  
  if (!token || !secret) {
    console.warn("Accurate Online credentials missing in environment variables.");
    return null;
  }

  const timestamp = getAccurateTimestamp();
  const signature = generateSignature(timestamp, secret);

  // If the baseUrl is the central account URL, we must resolve the specific database host
  if (baseUrl === 'https://account.accurate.id') {
    try {
      const hostRes = await fetch('https://account.accurate.id/api/api-token.do', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Api-Timestamp': timestamp,
          'X-Api-Signature': signature,
        }
      });
      const hostText = await hostRes.text();
      if (hostRes.ok) {
        try {
          const hostData = JSON.parse(hostText);
          const resolvedHost = hostData?.d?.database?.host || hostData?.d?.['data usaha']?.host || hostData?.host;
          if (resolvedHost) {
            baseUrl = resolvedHost;
          } else {
             console.error("Accurate API: /api-token.do succeeded but no host found in response:", hostData);
          }
        } catch (e) {
          console.error("Accurate API: /api-token.do returned invalid JSON:", hostText.slice(0, 100));
        }
      } else {
        console.error(`Accurate API Error: /api-token.do failed with ${hostRes.status} ${hostRes.statusText}`, hostText.slice(0, 200));
      }
    } catch (e) {
      console.error("Failed to resolve Accurate host from api-token.do:", e);
    }
  }

  const url = new URL(endpoint, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Api-Timestamp': timestamp,
        'X-Api-Signature': signature,
      },
      redirect: 'follow', // Handles 308 permanent redirect
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Accurate API Error: ${res.status} ${res.statusText}`, text.slice(0, 200));
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error("Accurate API Fetch Error: Failed to parse JSON. Response was HTML or invalid format.");
      return null;
    }
  } catch (err) {
    console.error("Accurate API Fetch Error:", err);
    return null;
  }
}

export async function getAccurateSalesData(startIso: string, endIso: string) {
  // Accurate POS syncs transactions to Accurate Online as Sales Invoices (Faktur Penjualan),
  // which contains the totalAmount field in the list endpoint.
  let url = '/accurate/api/sales-invoice/list.do'; 
  
  let receipts: any[] = [];
  let page = 1;
  const pageSize = 100;
  
  while (true) {
    const params: any = {
      fields: 'id,number,transDate,totalAmount,customer',
      'sp.page': page,
      'sp.pageSize': pageSize
    };

    const res = await fetchAccurate(url, params);

    if (!res || !res.d) {
      break;
    }

    receipts = receipts.concat(res.d);

    if (res.sp && res.sp.page < res.sp.pageCount) {
      page++;
    } else {
      break;
    }
  }

  // If the API call fails or env vars are missing, return 0s so the dashboard doesn't crash
  if (receipts.length === 0) {
    return {
      revenueSum: 0,
      transactionsCount: 0,
      aov: 0,
      products: [],
      dailyStats: {},
      itemsSold: 0
    };
  }

  let revenueSum = 0;
  let transactionsCount = 0;
  let itemsSold = 0;
  const productMap: Record<string, { qty: number, revenue: number }> = {};
  const dailyStats: Record<string, { revenue: number, count: number, newMembers?: number, visits?: number }> = {};
  
  // Convert target start/end to comparable dates
  const startD = new Date(startIso + 'T00:00:00Z');
  const endD = new Date(endIso + 'T23:59:59Z');

  for (const receipt of receipts) {
    // transDate comes as string, e.g., "01/11/2023" or similar
    // Accurate typically returns dd/mm/yyyy. new Date() will silently misparse dates like 12/07/2026 as Dec 7th.
    // So we must manually split if there is a slash.
    let rDate: Date;
    if (typeof receipt.transDate === 'string' && receipt.transDate.includes('/')) {
        const parts = receipt.transDate.split(/[\s/:]+/);
        if (parts.length >= 3) {
            rDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${parts[3] || '12'}:${parts[4] || '00'}:00Z`);
        } else {
            rDate = new Date(receipt.transDate);
        }
    } else {
        rDate = new Date(receipt.transDate);
    }

    if (!isNaN(rDate.getTime())) {
      // Filter manually
      if (rDate < startD || rDate > endD) {
        continue;
      }
    }

    const isoDate = !isNaN(rDate.getTime()) ? rDate.toISOString().slice(0, 10) : endIso;

    if (!dailyStats[isoDate]) {
      dailyStats[isoDate] = { revenue: 0, count: 0 };
    }

    const amt = receipt.totalAmount || 0;
    revenueSum += amt;
    transactionsCount += 1;
    
    dailyStats[isoDate].revenue += amt;
    dailyStats[isoDate].count += 1;

    // We only fetch detail.do if it falls in the range, to populate products
    // (Rate limiting note: we use Promise.all in batches later if needed, 
    // but for now we fetch sequentially to respect basic API limits)
    receipt._toFetchDetail = true;
  }

  // Fetch details to get products
  const receiptsToFetch = receipts.filter(r => r._toFetchDetail);
  
  // To avoid hitting API rate limits too hard, we fetch concurrently in small chunks
  const chunkSize = 5;
  for (let i = 0; i < receiptsToFetch.length; i += chunkSize) {
    const chunk = receiptsToFetch.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (receipt) => {
      try {
        const detailRes = await fetchAccurate('/accurate/api/sales-invoice/detail.do', { id: receipt.id.toString() });
        const details = detailRes?.d?.detailItem || [];
        for (const item of details) {
          const name = item.item?.name || item.itemName || 'Unknown Item';
          const qty = item.quantity || 1;
          const itemRev = item.totalPrice || (item.unitPrice * qty) || 0;
          itemsSold += qty;

          if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
          productMap[name].qty += qty;
          productMap[name].revenue += itemRev;
        }
      } catch (err) {
        console.error(`Failed to fetch detail for invoice ${receipt.id}`, err);
      }
    }));
  }

  const products = Object.keys(productMap)
    .map(name => ({
      name,
      qty: productMap[name].qty,
      revenue: productMap[name].revenue,
      contribution: revenueSum > 0 ? (productMap[name].revenue / revenueSum) * 100 : 0
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6); // Top 6 products

  return {
    revenueSum,
    transactionsCount,
    aov: transactionsCount > 0 ? revenueSum / transactionsCount : 0,
    products,
    dailyStats,
    itemsSold
  };
}
