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
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  let data = '';
  res.on('data', d => {
    console.log('DATA CHUNK:', d.length, 'bytes');
    data += d;
  });
  res.on('end', () => {
    console.log('BODY:', data.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', e => {
  console.error('ERROR:', e.code, e.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('SOCKET TIMEOUT');
  process.exit(2);
});

console.log('Sending request...');
const payload = JSON.stringify({email: 'test@test.com', password: 'test'});
console.log('Payload:', payload);
req.write(payload);
req.end();

setTimeout(() => {
  console.error('TIMEOUT (5s)');
  process.exit(3);
}, 5000);

console.log('Request ended, waiting for response...');
