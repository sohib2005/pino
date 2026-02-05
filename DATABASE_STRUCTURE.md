# Database Structure - T-Shirt Only E-Commerce

## Overview
The database has been simplified to focus exclusively on selling t-shirts. All complex product management tables have been removed and replaced with a single `TShirt` model.

## Database Schema

### 1. User Management

#### **User (Client)**
- `id`: UUID (Primary Key)
- `firstName`: String (optional)
- `lastName`: String (optional)
- `email`: String (optional)
- `password`: String (hashed)
- `phoneNumber`: String (unique) - Used for login
- `address`: String (optional)
- `role`: Role enum (ADMIN or CLIENT)

**Relations:**
- One-to-One with Cart
- One-to-Many with Orders

---

### 2. T-Shirt Product

#### **TShirt**
The main product table containing all t-shirt variations.

- `id`: BigInt (Primary Key)
- `name`: String - e.g., "T-Shirt Noir - L"
- `description`: Text (optional) - Product description
- `color`: String - e.g., "Noir", "Blanc", "Rouge"
- `size`: TShirtSize enum - XS, S, M, L, XL, XXL
- `sku`: String (unique) - Stock Keeping Unit, e.g., "TSH-NOI-L"
- `price`: Decimal(10,2) - Price in MAD
- `stock`: Integer - Current stock quantity
- `imageUrl`: String (optional) - Path to product image
- `isActive`: Boolean - Product visibility status
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Unique Constraints:**
- `(color, size)` - One entry per color-size combination
- `sku` - Unique SKU for each variant

**Relations:**
- One-to-Many with StockMovement
- One-to-Many with CartItem
- One-to-Many with OrderItem

---

### 3. Stock Management

#### **StockMovement**
Tracks all stock changes for inventory management.

- `id`: BigInt (Primary Key)
- `tshirtId`: BigInt (Foreign Key)
- `quantity`: Integer - Amount added or removed
- `type`: StockMovementType enum - IN or OUT
- `reason`: String (optional) - Reason for stock change
- `createdAt`: DateTime

**Types:**
- `IN`: Stock added (restocking, returns)
- `OUT`: Stock removed (sales, damage, loss)

---

### 4. Shopping Cart

#### **Cart**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key, unique) - One cart per user
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### **CartItem**
- `id`: BigInt (Primary Key)
- `cartId`: UUID (Foreign Key)
- `tshirtId`: BigInt (Foreign Key)
- `quantity`: Integer (default: 1)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Unique Constraint:**
- `(cartId, tshirtId)` - One entry per t-shirt in cart

---

### 5. Orders

#### **Order**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `orderNumber`: String (unique) - e.g., "ORD-1737564000000"
- `status`: OrderStatus enum - EN_ATTENTE, EN_COURS, LIVRE, ANNULE
- `totalAmount`: Decimal(10,2) - Total order amount
- `address`: Text - Delivery address
- `phoneNumber`: String - Contact phone
- `notes`: Text (optional) - Order notes
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Order Statuses:**
- `EN_ATTENTE`: Pending/Waiting
- `EN_COURS`: In Progress
- `LIVRE`: Delivered
- `ANNULE`: Cancelled

#### **OrderItem**
- `id`: BigInt (Primary Key)
- `orderId`: UUID (Foreign Key)
- `tshirtId`: BigInt (Foreign Key)
- `quantity`: Integer
- `unitPrice`: Decimal(10,2) - Price at time of order
- `totalPrice`: Decimal(10,2) - quantity × unitPrice

---

## Enums

### TShirtSize
```typescript
enum TShirtSize {
  XS
  S
  M
  L
  XL
  XXL
}
```

### OrderStatus
```typescript
enum OrderStatus {
  EN_ATTENTE  // Pending
  EN_COURS    // In Progress
  LIVRE       // Delivered
  ANNULE      // Cancelled
}
```

### StockMovementType
```typescript
enum StockMovementType {
  IN   // Stock added
  OUT  // Stock removed
}
```

### Role
```typescript
enum Role {
  ADMIN
  CLIENT
}
```

---

## Sample Data Structure

### Example T-Shirt Entry
```json
{
  "id": 1,
  "name": "T-Shirt Noir - L",
  "description": "T-shirt de qualité supérieure en coton, couleur Noir, taille L",
  "color": "Noir",
  "size": "L",
  "sku": "TSH-NOI-L",
  "price": 150.00,
  "stock": 45,
  "imageUrl": "/imgs/tshirt-noir.jpg",
  "isActive": true
}
```

### Available Colors
- Noir (Black)
- Blanc (White)
- Gris (Grey)
- Bleu Marine (Navy Blue)
- Rouge (Red)
- Vert (Green)

---

## Key Simplifications

### Removed Tables
- ❌ Category
- ❌ Product
- ❌ ProductVariant
- ❌ Attribute
- ❌ AttributeValue
- ❌ VariantAttributeValue
- ❌ ProductImage

### Replaced With
- ✅ **TShirt** - Single table with color and size as direct attributes
- ✅ Direct image URL storage (imageUrl field)
- ✅ Simplified stock management

---

## Migration Status

**Migration Name:** `20260122165138_init_tshirt_schema`
**Status:** ✅ Applied
**Database:** PostgreSQL

---

## Seeded Data

The database includes:
- 1 Admin user (Phone: 11111111)
- 1 Sample client (Phone: 50770418)
- 36 T-shirt variants (6 colors × 6 sizes)
- Sample order with 3 items
- Sample stock movements

**Login Credentials:**
- Admin - Phone: `11111111`, Password: `password123`
- Client - Phone: `50770418`, Password: `password123`

---

## Next Steps for Development

1. **Update Backend Services**
   - Modify ProductService to work with TShirt model
   - Update CartService for new relationships
   - Adjust OrderService for simplified structure

2. **Update Frontend Components**
   - Simplify product listing to show t-shirts only
   - Update product detail pages
   - Modify cart and checkout flows

3. **API Endpoints to Update**
   - `/products` → `/tshirts`
   - Update filter endpoints (color, size)
   - Simplify product creation/editing

4. **Future Considerations**
   - Easy to extend with more product types later
   - Can add back categories if needed
   - Stock management already in place
