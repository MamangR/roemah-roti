import { fetchAccurate } from './lib/accurate';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const res = await fetchAccurate('/accurate/api/customer/list.do', {
    'filter.id.op': 'EQUAL',
    'filter.id.val': 100,
    fields: 'id,customerNo,mobilePhone'
  });

  if (!res || !res.d) {
    console.log("Failed to fetch or no data:", res);
    return;
  }

  console.log("Got customer 100:", JSON.stringify(res.d, null, 2));
}

run().catch(console.error);
