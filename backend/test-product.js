
const BASE_URL = 'http://localhost:5001/api';

async function testProductCreation() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@cu-harvest.com', password: 'admin123' })
        });

        if (!loginRes.ok) {
            const err = await loginRes.json();
            throw new Error(`Login failed: ${loginRes.status} - ${err.message}`);
        }
        const { token } = await loginRes.json();
        console.log('Admin logged in.');

        // 2. Create Product
        console.log('Creating Product...');
        const product = {
            name: 'Test Product ' + Date.now(),
            category_id: 1, // Vegetables
            description: 'Test description',
            price: 15.50,
            stock_quantity: 100,
            unit: 'kg',
            image_url: 'https://example.com/image.png'
        };

        const createRes = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(product)
        });

        const createData = await createRes.json();
        console.log('Create Status:', createRes.status);
        console.log('Create Response:', JSON.stringify(createData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testProductCreation();
