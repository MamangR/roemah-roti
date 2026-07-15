const cron = require('node-cron');

console.log('Starting local cron job runner...');
console.log('Waiting for the scheduled time (Every day at 12:00 PM)...');

// Schedule tasks to be run on the server.
// '0 12 * * *' runs at 12:00 PM every day.
cron.schedule('0 12 * * *', async () => {
  console.log('Running scheduled status update job at 12:00 PM...');
  
  try {
    // Assuming the Next.js server is running on localhost:3000
    const res = await fetch('http://localhost:3000/api/cron/update-status');
    const data = await res.json();
    
    if (res.ok) {
      console.log('Status update successful:', data);
    } else {
      console.error('Status update failed:', data);
    }
  } catch (error) {
    console.error('Could not reach the server. Make sure Next.js (npm run dev/start) is running on port 3000.');
    console.error(error.message);
  }
});
