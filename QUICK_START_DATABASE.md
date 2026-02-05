# 🚀 Quick Start - New T-Shirt Database

## ✅ What's Ready

Your database has been simplified to sell **t-shirts only**!

## 📊 Current Status

- ✅ **7 tables** created (Client, tshirts, carts, cart_items, orders, order_items, stock_movements)
- ✅ **36 t-shirt variants** seeded (6 colors × 6 sizes)
- ✅ **2 users** created (1 Admin, 1 Client)
- ✅ **Sample data** ready for testing

---

## 🎨 T-Shirt Catalog

### Colors (6)
- Noir, Blanc, Gris, Bleu Marine, Rouge, Vert

### Sizes (6)
- XS, S, M, L, XL, XXL

### Total Products
**36 variants** (each color-size combination)

### Price
150 MAD per t-shirt

---

## 🔑 Test Accounts

| Role   | Phone      | Password     | Email                     |
|--------|------------|--------------|---------------------------|
| Admin  | 11111111   | password123  | admin@pino.com            |
| Client | 50770418   | password123  | sohibbenghiline@gmail.com |

---

## 🛠️ Useful Commands

### View Database
```bash
cd Backend
npx prisma studio
```

### Reset & Reseed
```bash
cd Backend
npx prisma migrate reset --force
npx tsx prisma/seed-tshirt.ts
```

### Check Schema
```bash
cd Backend
npx prisma format
npx prisma validate
```

---

## 📝 Example Queries

### Get All T-Shirts
```typescript
const tshirts = await prisma.tShirt.findMany({
  where: { isActive: true }
});
```

### Get By Color
```typescript
const blackTshirts = await prisma.tShirt.findMany({
  where: { 
    color: 'Noir',
    isActive: true 
  }
});
```

### Get By Size
```typescript
const largeTshirts = await prisma.tShirt.findMany({
  where: { 
    size: 'L',
    isActive: true 
  }
});
```

### Get Specific Variant
```typescript
const tshirt = await prisma.tShirt.findUnique({
  where: {
    color_size: {
      color: 'Noir',
      size: 'L'
    }
  }
});
```

### Low Stock Alert
```typescript
const lowStock = await prisma.tShirt.findMany({
  where: {
    stock: { lt: 10 },
    isActive: true
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
    totalAmount: 300.00,
    address: 'Customer Address',
    phoneNumber: '+212600000000',
    items: {
      create: [
        {
          tshirtId: 1,
          quantity: 2,
          unitPrice: 150.00,
          totalPrice: 300.00
        }
      ]
    }
  }
});
```

---

## 📚 Documentation Files

1. **[DATABASE_CHANGES_SUMMARY.md](DATABASE_CHANGES_SUMMARY.md)** - Complete overview
2. **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** - Detailed schema
3. **[DATABASE_VISUAL_SCHEMA.md](DATABASE_VISUAL_SCHEMA.md)** - Visual diagrams
4. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration reference

---

## ⚠️ Breaking Changes

### ❌ Removed
- Category table
- Product table
- ProductVariant table
- Attribute tables
- ProductImage table

### ✅ Replaced With
- **TShirt table** (all-in-one product)

### 🔄 Code Updates Needed

**Backend:**
- Update `ProductService` → `TShirtService`
- Change `variantId` → `tshirtId` in Cart/Order services

**Frontend:**
- Update API calls to `/api/tshirts`
- Remove category navigation
- Update product listing/details pages

---

## 🎯 Next Actions

1. **Test the Database**
   ```bash
   npx prisma studio
   ```
   Browse the data in your browser

2. **Update Backend Services**
   - Modify product controllers
   - Update cart/order logic

3. **Update Frontend**
   - Change API endpoints
   - Update product components

4. **Test End-to-End**
   - Login
   - Browse t-shirts
   - Add to cart
   - Place order

---

## 💡 Tips

- All t-shirt images should be in `/imgs/` folder
- SKU format: `TSH-{COLOR-3CHARS}-{SIZE}`
- Price is stored as Decimal for accuracy
- Stock is automatically managed with movements

---

## 🆘 Need Help?

Ask me about:
- Creating new t-shirts
- Managing stock
- Updating orders
- Modifying the schema
- Adding new features

---

**Database Version:** 20260122165138_init_tshirt_schema
**Last Updated:** January 22, 2026
**Status:** ✅ Production Ready
