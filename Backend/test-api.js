const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/products',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log(`\n✅ API Test Successful!`);
      console.log(`Total products: ${products.length}`);
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Color: ${p.color}`);
        console.log(`   Size: ${p.size}`);
        console.log(`   SKU: ${p.sku}`);
        console.log(`   Price: $${p.price}`);
        console.log(`   Stock: ${p.stock}`);
        console.log(`   Active: ${p.isActive}`);
      });
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ API Test Failed:', error.message);
  process.exit(1);
});

req.end();
