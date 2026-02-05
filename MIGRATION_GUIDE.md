# Quick Reference: Database Simplification

## ✅ What Changed

### Before (Complex Multi-Product System)
```
📦 Category
  └── 📦 Product
       └── 📦 ProductVariant (with Attributes)
            ├── 🖼️ ProductImage
            ├── 📊 StockMovement
            ├── 🛒 CartItem
            └── 📦 OrderItem
```

### After (Simple T-Shirt Only)
```
👕 TShirt (all-in-one)
    ├── 📊 StockMovement
    ├── 🛒 CartItem
    └── 📦 OrderItem
```

---

## 📊 Database Tables

### Active Tables ✅
1. **Client** (User table)
2. **tshirts** (Main product table)
3. **carts**
4. **cart_items**
5. **orders**
6. **order_items**
7. **stock_movements**

### Removed Tables ❌
1. ~~categories~~
2. ~~products~~
3. ~~product_variants~~
4. ~~attributes~~
5. ~~attribute_values~~
6. ~~variant_attribute_values~~
7. ~~product_images~~

---

## 🎨 T-Shirt Model

Each t-shirt is a **complete product** with:
- Color (e.g., "Noir", "Blanc", "Rouge")
- Size (XS, S, M, L, XL, XXL)
- Price (150 MAD)
- Stock quantity
- Image URL
- SKU (unique identifier)

**Example:** "T-Shirt Noir - L" with SKU "TSH-NOI-L"

---

## 📝 Code Changes Needed

### 1. Backend Services

#### Product Service → TShirt Service
```typescript
// OLD
productService.getVariants()
productService.getByCategory()

// NEW
tshirtService.getByColor()
tshirtService.getBySize()
tshirtService.getAvailable()
```

#### Cart Service
```typescript
// OLD
cartItem.variantId

// NEW
cartItem.tshirtId
```

#### Order Service
```typescript
// OLD
orderItem.variantId

// NEW
orderItem.tshirtId
```

### 2. API Routes

Update these endpoints:
```
/api/products → /api/tshirts
/api/products/:id/variants → /api/tshirts/:id
/api/categories → (remove)
```

### 3. Frontend Updates

#### Product Listing
- Remove category navigation
- Add color/size filters
- Simplify product cards

#### Product Details
- No variant selection needed
- Direct color/size display
- Simplified stock check

---

## 🔄 Migration Commands

```bash
# View migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Seed database
npx tsx prisma/seed-tshirt.ts

# Open database browser
npx prisma studio
```

---

## 🧪 Testing the Database

### Check T-Shirts
```typescript
const tshirts = await prisma.tShirt.findMany({
  where: {
    color: 'Noir',
    size: 'L',
    isActive: true
  }
});
```

### Check Stock
```typescript
const lowStock = await prisma.tShirt.findMany({
  where: {
    stock: { lt: 10 }
  }
});
```

### Create Order
```typescript
const order = await prisma.order.create({
  data: {
    userId: userId,
    orderNumber: `ORD-${Date.now()}`,
    status: 'EN_ATTENTE',
    items: {
      create: [
        {
          tshirtId: 1,
          quantity: 2,
          unitPrice: 150,
          totalPrice: 300
        }
      ]
    }
  }
});
```

---

## 🎯 Benefits of New Structure

1. **Simpler** - One table instead of 7
2. **Faster** - Fewer joins, better performance
3. **Clearer** - Direct attributes, no complex relations
4. **Maintainable** - Easier to understand and modify
5. **Extensible** - Can add more fields later if needed

---

## 📦 Seeded Data

After running seed script:
- ✅ 36 T-shirt variants (6 colors × 6 sizes)
- ✅ 2 Users (1 Admin, 1 Client)
- ✅ 1 Sample order
- ✅ Stock movement records

---

## 🚀 Next Development Tasks

1. [ ] Update Product Controller → TShirt Controller
2. [ ] Modify Cart Service for tshirtId
3. [ ] Update Order Service references
4. [ ] Adjust Frontend product pages
5. [ ] Update API documentation
6. [ ] Test all CRUD operations
7. [ ] Update stock management UI

---

## 💡 Future Enhancements

When client wants to expand:
- Add `productType` enum (TSHIRT, HOODIE, CAP, etc.)
- Add `category` field if needed
- Keep the simple structure, just add fields
- No need to recreate complex tables
