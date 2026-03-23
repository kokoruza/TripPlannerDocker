const http = require('http');
const opts = {
  hostname: 'nginx',
  port: 80,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 43
  }
};
const req = http.request(opts, res => {
  console.log('HTTP Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log('Response length:', body.length);
    console.log('Response text:', body.substring(0, 500));
    process.exit(res.statusCode < 500 ? 0 : 1);
  });
});
req.on('error', e => {
  console.error('Request error:', e.message);
  process.exit(1);
});
req.write(JSON.stringify({email: 'test@test.com', password: 'test'}));
req.end();
setTimeout(() => {
  console.error('Request timeout');
  process.exit(2);
}, 5000);
