const http = require('http');
const opts = {hostname: 'nginx', port: 80, path: '/api/health', method: 'GET'};
const req = http.request(opts, (res) => {
  console.log('Nginx Proxy Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
req.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
req.end();
setTimeout(() => { console.error('Timeout'); process.exit(2); }, 3000);
