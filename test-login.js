const http = require('http');
const opts = {hostname: 'nginx', port: 80, path: '/api/auth/login', method: 'POST', headers: {'Content-Type': 'application/json'}};
const req = http.request(opts, (res) => {
  console.log('Login Status:', res.statusCode);
  process.exit(res.statusCode === 200 || res.statusCode === 400 ? 0 : 1);
});
req.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
req.write(JSON.stringify({email: 'test@test.com', password: 'test'}));
req.end();
setTimeout(() => { console.error('Timeout'); process.exit(2); }, 3000);
