const http = require('http');
const opts = {hostname: 'nginx', port: 80, path: '/api/auth/login', method: 'POST', headers: {'Content-Type': 'application/json', 'Content-Length': 43}};
const req = http.request(opts, res => {
  console.log('LOGIN STATUS:', res.statusCode);
  res.on('data', d => null);
  res.on('end', () => process.exit(0));
});
req.on('error', e => { console.error('ERROR:', e.message); process.exit(1); });
req.write(JSON.stringify({email: 'test@test.com', password: 'test'}));
req.end();
setTimeout(() => process.exit(2), 3000);
