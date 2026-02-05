/**
 * Test script to verify product deletion works correctly
 * - SOFT DELETE for products in orders
 * - HARD DELETE for unused products
 */

const API_BASE = 'http://localhost:3001';

async function testDeleteProduct(productId) {
  console.log(`\n🧪 Testing deletion of product ${productId}...`);
  
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Delete failed:', response.status);
      console.error('   Error:', data.message || data);
      return false;
    }
    
    if (data.action === 'deactivated') {
      console.log('✅ SOFT DELETE successful!');
      console.log('   Reason:', data.reason);
      console.log('   Message:', data.message);
    } else if (data.action === 'deleted') {
      console.log('✅ HARD DELETE successful!');
      console.log('   Message:', data.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function verifyProductStatus(productId) {
  console.log(`\n🔍 Verifying product ${productId} status...`);
  
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    
    if (response.status === 404) {
      console.log('✅ Product not found (hard deleted)');
      return 'deleted';
    }
    
    const data = await response.json();
    
    if (!data.isActive) {
      console.log('✅ Product is inactive (soft deleted)');
      console.log('   Stock:', data.stock || 0);
      return 'deactivated';
    }
    
    console.log('ℹ️  Product is still active');
    return 'active';
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return 'error';
  }
}

async function getAllProducts() {
  console.log('\n📋 Fetching all products (including inactive)...');
  
  try {
    const response = await fetch(`${API_BASE}/products?includeInactive=true`);
    const products = await response.json();
    
    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
      const status = p.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`  ${status} - ID: ${p.id}, Code: ${p.code}, Name: ${p.name}`);
    });
    
    return products;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
    return [];
  }
}

// Main test
(async () => {
  console.log('='.repeat(60));
  console.log('🧪 PRODUCT DELETION TEST');
  console.log('='.repeat(60));
  
  // First, list all products
  const products = await getAllProducts();
  
  if (products.length === 0) {
    console.log('\n⚠️  No products found. Please seed the database first.');
    console.log('   Run: npm run prisma:seed');
    return;
  }
  
  // Get first product to test
  const testProduct = products[0];
  console.log(`\n🎯 Will test deletion on product: ${testProduct.code} - ${testProduct.name}`);
  
  // Attempt delete
  const deleted = await testDeleteProduct(testProduct.id);
  
  if (deleted) {
    // Verify the result
    await verifyProductStatus(testProduct.id);
    
    // Show updated product list
    await getAllProducts();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
  console.log('='.repeat(60));
})();
