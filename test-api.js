const http = require('http');
const opts = {hostname: 'trip-planner-api', port: 5000, path: '/health', method: 'GET'};
const req = http.request(opts, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Data:', data);
    process.exit(0);
  });
});
req.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
req.end();
setTimeout(() => { console.error('Timeout'); process.exit(2); }, 3000);
