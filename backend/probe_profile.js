import http from 'http';

const data = JSON.stringify({
  name: 'Test Rider 2',
  email: `rider2_${Date.now()}@cu-harvest.com`,
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
    const json = JSON.parse(body);
    const token = json.token;
    console.log('Register Role returned:', json.user.role);

    // Now test profile
    const profileReq = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res2 => {
      let body2 = '';
      res2.on('data', chunk => { body2 += chunk; });
      res2.on('end', () => {
        const json2 = JSON.parse(body2);
        console.log('Profile Role returned:', json2.user.role);
      });
    });
    profileReq.end();
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
