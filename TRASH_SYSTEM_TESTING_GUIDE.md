# 🗑️ Product Deletion & Trash System - Testing Guide

## ✅ Implementation Complete

All components of the trash system are now fully implemented and running.

---

## 🎯 What Was Fixed

### 1. **Backend Issues**
- ❌ **Problem**: Foreign key constraint error when creating ProductDeletionRequest
  - Was using fake UUID `00000000-0000-0000-0000-000000000000` for adminId
- ✅ **Solution**: 
  - Made `createdBy` optional in Prisma schema
  - Only create deletion request if adminId is provided
  - Updated schema: `createdBy String? @db.Uuid` and `admin User?`

### 2. **Frontend Issues**
- ❌ **Problem**: Delete button appeared to "do nothing"
- ✅ **Solution**:
  - Added comprehensive logging to track delete flow
  - Properly handle `action` field from API response
  - Handle both `moved_to_trash` and `deleted` actions

### 3. **API Response Handling**
- Added better error handling in `lib/api.ts`
- Console logging for debugging delete responses
- Proper parsing of JSON even on error

---

## 📋 System Architecture

### **Delete Flow**

```
User clicks Delete
    ↓
Frontend calls: DELETE /products/:id
    ↓
Backend checks: Is product used in orders/returns?
    ↓
┌─────────────────┴───────────────┐
│                                 │
YES                              NO
│                                 │
↓                                 ↓
SOFT DELETE                    HARD DELETE
- Set isDeleted=true           - Delete from DB
- Set isActive=false           - Remove completely
- Create deletion request      
- Return {action: 'moved_to_trash'}  Return {action: 'deleted'}
    ↓                                 ↓
Product moved to Corbeille       Product removed
```

---

## 🔌 Available Endpoints

### 1. **Delete Product**
```http
DELETE /products/:id
Body: { adminId?: string }

Response:
{
  action: 'deleted' | 'moved_to_trash',
  message: string
}
```

### 2. **Get Trash**
```http
GET /products/trash/list

Response: Product[] (with deletionRequest, variants, orderItems)
```

### 3. **Restore Product**
```http
POST /products/:id/restore

Response:
{
  action: 'restored',
  message: string
}
```

### 4. **Permanent Delete**
```http
DELETE /products/:id/permanent

Response (if blocked):
{
  action: 'blocked',
  blockingOrders: Order[],
  options: [...]
}

Response (if successful):
{
  action: 'deleted_permanently',
  message: string
}
```

### 5. **Force Delete with Orders**
```http
DELETE /products/:id/permanent-with-orders

Response:
{
  action: 'deleted_orders_and_product',
  message: string,
  deletedOrders: number,
  deletedCustomOrders: number
}
```

---

## 🧪 Testing Steps

### **Test 1: Delete Unused Product (Hard Delete)**

1. Navigate to: http://localhost:3000/admin/products
2. Find a product with **NO orders** (stock = 0, newly created)
3. Click **Delete** button
4. Confirm deletion
5. **Expected**: 
   - ✅ Success message: "Produit supprimé avec succès !"
   - ✅ Product removed from list immediately
   - ✅ Console log: `action: 'deleted'`

---

### **Test 2: Delete Product With Orders (Move to Trash)**

1. Navigate to: http://localhost:3000/admin/products
2. Find a product that has been **ordered** (has order history)
3. Click **Delete** button
4. Confirm deletion
5. **Expected**:
   - ✅ Success message: "Produit déplacé vers la corbeille"
   - ✅ Product removed from "Produits" list
   - ✅ Console log: `action: 'moved_to_trash'`

---

### **Test 3: View Trash / Corbeille**

1. In admin products page, click **🗑️ Corbeille** tab
2. **Expected**:
   - ✅ See deleted products
   - ✅ See deletion info (date, admin, reason)
   - ✅ See order summary with status badges
   - ✅ Two buttons: "Restaurer" and "Supprimer définitivement"

**Trash View Shows**:
- Product code, name, color
- Deletion date and admin who deleted it
- Order summary:
  - 🟡 Yellow badge: Orders "en attente"
  - 🔵 Blue badge: Orders "en cours"
  - 🟢 Green badge: Orders "livrées"
  - ⚪ Gray badge: Orders "annulées"

---

### **Test 4: Restore Product**

1. In Corbeille tab, find a deleted product
2. Click **Restaurer** button
3. **Expected**:
   - ✅ Success message: "Produit restauré"
   - ✅ Product removed from trash
   - ✅ Switch to "Produits" tab → product appears back in active list

---

### **Test 5: Permanent Delete (Allowed)**

1. In Corbeille tab, find a product where ALL orders are:
   - Status: `LIVRE` (delivered) OR `ANNULE` (cancelled)
2. Click **Supprimer définitivement**
3. **Expected**:
   - ✅ Success message: "Produit supprimé définitivement"
   - ✅ Product removed from trash permanently
   - ✅ Product deleted from database

---

### **Test 6: Permanent Delete (Blocked) - Show Modal**

1. In Corbeille tab, find a product with orders that are:
   - Status: `EN_ATTENTE` (pending) OR `EN_COURS` (in progress)
2. Click **Supprimer définitivement**
3. **Expected**:
   - ⚠️ Modal appears with warning
   - ⚠️ Shows list of blocking orders with status badges
   - ⚠️ Two options:
     - **Option A** (Red): "Supprimer commandes + produit" (dangerous)
     - **Option B** (Gray): "Garder dans la corbeille" (safe)

---

### **Test 7: Force Delete Product + Orders**

1. Continue from Test 6 (modal is open)
2. Click **Option A**: "Supprimer commandes + produit"
3. **Expected**:
   - ⚠️ Product deleted
   - ⚠️ ALL related orders deleted (EN_ATTENTE, EN_COURS, etc.)
   - ⚠️ Custom orders deleted
   - ✅ Success message showing count of deleted orders
   - ✅ Product removed from trash

---

### **Test 8: Keep in Trash**

1. Continue from Test 6 (modal is open)
2. Click **Option B**: "Garder dans la corbeille"
3. **Expected**:
   - ✅ Modal closes
   - ✅ Product stays in trash
   - ✅ Info message: "Produit conservé dans la corbeille"

---

## 🐛 Debugging

### **Console Logs to Watch**

When deleting a product, check browser console for:

```javascript
🗑️ Deleting product: 123
📥 Delete response: { action: 'moved_to_trash', message: '...' }
📦 Product moved to trash
```

OR

```javascript
🗑️ Deleting product: 456
📥 Delete response: { action: 'deleted', message: '...' }
✅ Product hard deleted
```

### **Backend Logs**

Backend shows all registered routes including:
```
[RouterExplorer] Mapped {/products/:id, DELETE} route
[RouterExplorer] Mapped {/products/trash/list, GET} route
[RouterExplorer] Mapped {/products/:id/restore, POST} route
[RouterExplorer] Mapped {/products/:id/permanent, DELETE} route
[RouterExplorer] Mapped {/products/:id/permanent-with-orders, DELETE} route
```

---

## 📊 Database Schema

### **Product Model**
```prisma
model Product {
  id                 BigInt    @id @default(autoincrement())
  code               String    @unique
  name               String
  color              String
  isActive           Boolean   @default(true)
  isDeleted          Boolean   @default(false)      // 🆕 Soft delete flag
  deletedAt          DateTime?                      // 🆕 When deleted
  deletedBy          String?   @db.Uuid             // 🆕 Admin who deleted
  deletionRequest    ProductDeletionRequest?        // 🆕 Deletion metadata
  // ... other fields
}
```

### **ProductDeletionRequest Model**
```prisma
model ProductDeletionRequest {
  id        String   @id @default(uuid())
  productId BigInt   @unique
  createdAt DateTime @default(now())
  createdBy String?  @db.Uuid                        // 🔧 Made optional
  reason    String?
  status    String   @default("PENDING")              // PENDING | DELETED | RESTORED
  
  product   Product  @relation(...)
  admin     User?    @relation(...)                   // 🔧 Made optional
}
```

---

## ⚠️ Business Rules

### **Deletion Logic**

| Condition | Action | Result |
|-----------|--------|--------|
| Product has NO orders/returns | Hard Delete | Removed from DB completely |
| Product has orders/returns | Soft Delete | `isDeleted=true`, moved to trash |
| Restore from trash | Update flags | `isDeleted=false`, back to active |
| Permanent delete (all orders LIVRE/ANNULE) | Hard Delete | Removed from DB |
| Permanent delete (has EN_ATTENTE/EN_COURS) | Blocked | Show modal with options |
| Force delete with orders | Cascade Delete | Delete orders + product |

### **Order Status Hierarchy**

✅ **Allow Permanent Delete**:
- `LIVRE` - Delivered
- `ANNULE` - Cancelled

⚠️ **Block Permanent Delete**:
- `EN_ATTENTE` - Pending
- `EN_COURS` - In Progress

---

## 🎨 UI Components

### **DeleteConfirmModal**
- Shows when permanent delete is blocked
- Displays blocking orders with status badges
- Two clear options with color coding:
  - Red (dangerous): Delete everything
  - Gray (safe): Keep in trash
- Cancel button to close

### **Trash Tab Features**
- Count badge showing items in trash
- Empty state with 🗑️ icon
- Product cards with full context:
  - Deletion metadata
  - Order summary
  - Action buttons
- Responsive layout

---

## 🚀 Production Checklist

Before deploying:

- [ ] Test all 8 scenarios above
- [ ] Verify console logs show correct actions
- [ ] Check database for soft-deleted products (`isDeleted=true`)
- [ ] Confirm foreign key constraints working
- [ ] Test restore functionality
- [ ] Test permanent delete with various order statuses
- [ ] Test force delete (nuclear option)
- [ ] Verify modal appearance and functionality
- [ ] Check responsive design on mobile
- [ ] Add authentication guards (adminId from session)

---

## 📝 Notes

- **Admin Authentication**: Currently `adminId` is optional. In production, get it from authenticated session.
- **Logging**: Console logs are included for debugging. Remove in production or use proper logging service.
- **Permissions**: Add role-based access control for trash operations.
- **Audit Trail**: Consider logging all deletion actions to separate audit table.

---

## 🔗 Related Files

### Backend
- `Backend/src/product/product.service.ts` - Core deletion logic
- `Backend/src/product/product.controller.ts` - API endpoints
- `Backend/prisma/schema.prisma` - Database schema

### Frontend
- `Frontend/lib/api.ts` - API client
- `Frontend/app/admin/products/page.tsx` - Admin UI with tabs
- `Frontend/app/admin/products/DeleteConfirmModal.tsx` - Blocking modal

---

## ✅ Status

- **Backend**: ✅ Running on http://localhost:3001
- **Frontend**: ✅ Running on http://localhost:3000
- **Database**: ✅ Schema synced
- **Prisma Client**: ✅ Generated (v7.3.0)
- **Build**: ✅ 0 errors
- **Endpoints**: ✅ All 5 trash endpoints registered

**System is ready for testing! 🎉**
