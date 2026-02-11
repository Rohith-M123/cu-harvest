


const BASE_URL = 'http://localhost:5001/api/auth';

async function testAuth() {
    const timestamp = Date.now();
    const testUser = {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'password123',
        phone: '1234567890'
    };

    console.log('1. Testing Signup...');
    try {
        const signupRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const signupData = await signupRes.json();
        console.log('Signup Status:', signupRes.status);
        console.log('Signup Response:', JSON.stringify(signupData, null, 2));

        if (!signupRes.ok) throw new Error('Signup failed');

        console.log('\n2. Testing Login...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (!loginRes.ok) throw new Error('Login failed');

        console.log('\n✅ Verification Successful!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

testAuth();
