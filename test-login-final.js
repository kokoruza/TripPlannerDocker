const http = require('http');
const opts = {
  hostname: 'nginx', 
  port: 80, 
  path: '/api/auth/login', 
  method: 'POST', 
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(opts, res => {
  console.log('✓ Login Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Response:', data.substring(0, 300));
    process.exit(res.statusCode === 200 || res.statusCode === 400 ? 0 : 1);
  });
});

req.on('error', e => {
  console.error('✗ ERROR:', e.message);
  process.exit(1);
});

// Try with Username field (correct field name)
const payload = JSON.stringify({username: 'testuser', password: 'testpass123'});
console.log('Sending login request with:', payload);
req.write(payload);
req.end();

setTimeout(() => { console.error('TIMEOUT'); process.exit(2); }, 5000);
