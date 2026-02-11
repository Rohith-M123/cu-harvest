// using native fetch

async function testFetch() {
    try {
        const res = await fetch('http://localhost:5001/api/products');
        const data = await res.json();

        if (data.success) {
            console.log(`Successfully fetched ${data.count} products.`);
            console.log('Last 3 products:');
            console.log(JSON.stringify(data.products.slice(0, 3), null, 2));

            const nullCats = data.products.filter(p => !p.category_name);
            if (nullCats.length > 0) {
                console.log(`WARNING: ${nullCats.length} products have NULL category_name (but are visible thanks to LEFT JOIN).`);
                console.log(JSON.stringify(nullCats.map(p => ({ id: p.id, name: p.name })), null, 2));
            } else {
                console.log('All products have valid categories.');
            }
        } else {
            console.error('Failed to fetch:', data.message);
            if (data.error) console.error('Details:', data.error);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

testFetch();
