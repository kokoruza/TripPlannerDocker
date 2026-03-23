const http = require('http');
const opts = {hostname: 'nginx', port: 80, path: '/api/health', method: 'GET'};
const req = http.request(opts, res => {
  console.log('HEALTH STATUS:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('RESPONSE:', data);
    process.exit(0);
  });
});
req.on('error', e => { console.error('ERROR:', e.message); process.exit(1); });
req.end();
setTimeout(() => { console.error('TIMEOUT'); process.exit(2); }, 5000);
