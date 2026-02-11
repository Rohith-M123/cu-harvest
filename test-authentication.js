// Test all authentication scenarios
const testAuth = async () => {
  console.log('🧪 Testing Authentication System...\n');
  
  // Test 1: Register new user
  console.log('1️⃣ Testing User Registration...');
  try {
    const registerResponse = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        phone: '1234567890'
      })
    });
    
    const registerResult = await registerResponse.json();
    console.log('✅ Registration:', registerResult.success ? 'SUCCESS' : 'FAILED');
    if (registerResult.success) {
      console.log('   User ID:', registerResult.user.id);
      console.log('   Token received:', !!registerResult.token);
    } else {
      console.log('   Error:', registerResult.message);
    }
  } catch (error) {
    console.log('❌ Registration failed:', error.message);
  }
  
  // Test 2: Login with newly created user
  console.log('\n2️⃣ Testing User Login...');
  try {
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test123@example.com',
        password: 'password123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('✅ User Login:', loginResult.success ? 'SUCCESS' : 'FAILED');
    if (loginResult.success) {
      console.log('   Welcome,', loginResult.user.name);
      console.log('   Role:', loginResult.user.role);
    } else {
      console.log('   Error:', loginResult.message);
    }
  } catch (error) {
    console.log('❌ User Login failed:', error.message);
  }
  
  // Test 3: Admin Login
  console.log('\n3️⃣ Testing Admin Login...');
  try {
    const adminLoginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'properadmin@example.com',
        password: 'admin123'
      })
    });
    
    if (!adminLoginResponse.ok) {
      const errorText = await adminLoginResponse.text();
      console.log('❌ Admin Login HTTP Error:', adminLoginResponse.status, errorText);
      return;
    }
    
    const adminLoginResult = await adminLoginResponse.json();
    console.log('✅ Admin Login:', adminLoginResult.success ? 'SUCCESS' : 'FAILED');
    if (adminLoginResult.success) {
      console.log('   Welcome Admin,', adminLoginResult.user.name);
      console.log('   Role:', adminLoginResult.user.role);
      console.log('   Token length:', adminLoginResult.token.length);
    } else {
      console.log('   Error:', adminLoginResult.message);
    }
  } catch (error) {
    console.log('❌ Admin Login failed:', error.message);
  }
  
  console.log('\n🏁 Authentication Tests Complete!');
};

testAuth();