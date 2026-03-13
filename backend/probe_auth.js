import http from 'http';

const data = JSON.stringify({
  name: 'Test Rider',
  email: `rider_${Date.now()}@cu-harvest.com`,
  password: 'password123',
  role: 'RIDER',
  firebase_uid: `uid_${Date.now()}`
});

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
