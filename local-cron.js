const cron = require('node-cron');

console.log('Starting local cron job runner...');
console.log('Waiting for the scheduled time (Every day at 12:00 PM)...');

// Schedule tasks to be run on the server.
// '0 12 * * *' runs at 12:00 PM every day.
cron.schedule('0 12 * * *', async () => {
  console.log('Running scheduled status update job at 12:00 PM...');
  
  try {
    // Assuming the Next.js server is running on localhost:3000
    const [resStatus, resSync] = await Promise.all([
      fetch('http://localhost:3000/api/cron/update-status'),
      fetch('http://localhost:3000/api/admin/sync-pos')
    ]);
    
    const dataStatus = await resStatus.json();
    const dataSync = await resSync.json();
    
    if (resStatus.ok) console.log('Status update successful:', dataStatus);
    else console.error('Status update failed:', dataStatus);

    if (resSync.ok) console.log('POS Sync successful:', dataSync);
    else console.error('POS Sync failed:', dataSync);
  } catch (error) {
    console.error('Could not reach the server. Make sure Next.js (npm run dev/start) is running on port 3000.');
    console.error(error.message);
  }
});
