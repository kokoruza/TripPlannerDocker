const http = require('http');
const opts = {hostname: 'nginx', port: 80, path: '/', method: 'GET'};
const req = http.request(opts, (res) => {
  console.log('Frontend Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    if (data.includes('html') || data.length > 100) {
      console.log('Frontend HTML received, length:', data.length);
    } else {
      console.log('Response:', data.substring(0, 200));
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
req.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
req.end();
setTimeout(() => { console.error('Timeout'); process.exit(2); }, 3000);
