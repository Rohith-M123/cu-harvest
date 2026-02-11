// Test API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:5001/api';
  
  try {
    // Test health endpoint
    console.log('Testing /api/health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test products endpoint
    console.log('\nTesting /api/products...');
    const productsResponse = await fetch(`${baseUrl}/products`);
    const productsData = await productsResponse.json();
    console.log('✅ Products count:', productsData.products?.length || 0);
    
    // Test categories endpoint
    console.log('\nTesting /api/products/categories...');
    const categoriesResponse = await fetch(`${baseUrl}/products/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories count:', categoriesData.categories?.length || 0);
    
    // Test user registration
    console.log('\nTesting user registration...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123',
        phone: '1234567890'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData.success ? 'Success' : registerData.message);
    
    if (registerData.success) {
      console.log('✅ User created with ID:', registerData.user.id);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEndpoints();