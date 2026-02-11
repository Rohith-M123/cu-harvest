import http from 'http';

http.get('http://localhost:5001/api/products', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Products found:', json.products.length);
            json.products.slice(0, 5).forEach(p => {
                console.log(`${p.name}: ${p.image_url}`);
            });
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw data:', data.slice(0, 100));
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
