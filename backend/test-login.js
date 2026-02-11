// Test login credentials
const testLogin = async () => {
  try {
    // Test login
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cu-harvest.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Result:', loginResult);
    
    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginResult.user);
      console.log('Token:', loginResult.token ? 'Received' : 'Not received');
    } else {
      console.log('❌ Login failed:', loginResult.message);
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
};

testLogin();