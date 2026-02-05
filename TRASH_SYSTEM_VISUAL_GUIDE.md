# 🗑️ Product Deletion System - Visual Flow

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN PRODUCTS PAGE                          │
│                     http://localhost:3000/admin                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼──────────┐       ┌───────────▼──────────┐
         │  📦 Produits Tab    │       │  🗑️ Corbeille Tab    │
         │  (Active Products)  │       │  (Trash Products)    │
         └──────────┬──────────┘       └───────────┬──────────┘
                    │                               │
            ┌───────▼────────┐              ┌──────▼──────┐
            │  DELETE Button │              │   RESTORE   │
            └───────┬────────┘              │   PERMANENT │
                    │                       │    DELETE   │
                    │                       └──────┬──────┘
                    │                              │
        ┌───────────▼────────────┐                 │
        │  DELETE /products/:id  │                 │
        │  Body: { adminId? }    │                 │
        └───────────┬────────────┘                 │
                    │                              │
        ┌───────────▼────────────┐                 │
        │  Product Service       │◄────────────────┘
        │  deleteProduct(id)     │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  Check: Used in        │
        │  orders/returns?       │
        └───────────┬────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
   ┌────▼────┐            ┌──────▼──────┐
   │   YES   │            │     NO      │
   └────┬────┘            └──────┬──────┘
        │                        │
   ┌────▼─────────────┐    ┌─────▼────────────┐
   │  SOFT DELETE     │    │  HARD DELETE     │
   │  ───────────     │    │  ───────────     │
   │  • isDeleted=true│    │  • DELETE FROM   │
   │  • isActive=false│    │    database      │
   │  • deletedAt=now │    │  • Remove images │
   │  • Create request│    │  • Remove stock  │
   └────┬─────────────┘    └─────┬────────────┘
        │                        │
   ┌────▼─────────────┐    ┌─────▼────────────┐
   │ Return:          │    │ Return:          │
   │ action:          │    │ action:          │
   │ 'moved_to_trash' │    │ 'deleted'        │
   └────┬─────────────┘    └─────┬────────────┘
        │                        │
        └────────┬───────────────┘
                 │
        ┌────────▼─────────┐
        │  Frontend UI     │
        │  Handles Action  │
        └────────┬─────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────┐    ┌───────▼──────────┐
│ moved_to_trash │    │    deleted       │
│ ────────────── │    │    ───────       │
│ • Remove from  │    │ • Remove from    │
│   product list │    │   product list   │
│ • Show message │    │ • Show message   │
│ • Console log  │    │ • Console log    │
└────────────────┘    └──────────────────┘
```

---

## 🔄 Trash Operations Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       CORBEILLE TAB                              │
│  Shows products where isDeleted=true                             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌──────────▼───────────┐
    │   RESTAURER       │         │  SUPPRIMER           │
    │   (Restore)       │         │  DÉFINITIVEMENT      │
    │                   │         │  (Permanent Delete)  │
    └─────────┬─────────┘         └──────────┬───────────┘
              │                              │
    ┌─────────▼─────────┐         ┌──────────▼───────────┐
    │ POST              │         │ DELETE               │
    │ /products/:id/    │         │ /products/:id/       │
    │ restore           │         │ permanent            │
    └─────────┬─────────┘         └──────────┬───────────┘
              │                              │
    ┌─────────▼─────────┐         ┌──────────▼───────────┐
    │ Update Product:   │         │ Check Order Statuses │
    │ • isDeleted=false │         │ for all variants     │
    │ • isActive=true   │         └──────────┬───────────┘
    │ • deletedAt=null  │                    │
    └─────────┬─────────┘         ┌──────────┴───────────┐
              │                   │                      │
    ┌─────────▼─────────┐    ┌────▼────┐          ┌─────▼──────┐
    │ Product returns   │    │ BLOCKED │          │  ALLOWED   │
    │ to active list    │    └────┬────┘          └─────┬──────┘
    └───────────────────┘         │                     │
                            ┌─────▼──────────┐    ┌─────▼──────┐
                            │ Has EN_ATTENTE │    │ All orders │
                            │ or EN_COURS    │    │ are LIVRE  │
                            │ orders         │    │ or ANNULE  │
                            └─────┬──────────┘    └─────┬──────┘
                                  │                     │
                            ┌─────▼──────────┐    ┌─────▼──────┐
                            │ SHOW MODAL     │    │ DELETE     │
                            │ with options:  │    │ Product +  │
                            │                │    │ Variants + │
                            │ A) Delete all  │    │ Cart Items │
                            │ B) Keep trash  │    └─────┬──────┘
                            └─────┬──────────┘          │
                                  │                ┌────▼────┐
                    ┌─────────────┴────────┐       │ Success │
                    │                      │       └─────────┘
              ┌─────▼──────┐      ┌────────▼────────┐
              │ Option A   │      │   Option B      │
              │ (Red Btn)  │      │   (Gray Btn)    │
              └─────┬──────┘      └────────┬────────┘
                    │                      │
    ┌───────────────▼─────────────┐        │
    │ DELETE /products/:id/       │        │
    │ permanent-with-orders       │        │
    └───────────────┬─────────────┘        │
                    │                      │
    ┌───────────────▼─────────────┐   ┌────▼─────┐
    │ CASCADE DELETE:             │   │  Close   │
    │ 1. Return Items             │   │  Modal   │
    │ 2. Returns                  │   │          │
    │ 3. Orders                   │   │  Keep in │
    │ 4. Custom Orders            │   │  Trash   │
    │ 5. Cart Items               │   └──────────┘
    │ 6. Stock Movements          │
    │ 7. Product & Variants       │
    └───────────────┬─────────────┘
                    │
    ┌───────────────▼─────────────┐
    │ Success: Show deleted count │
    │ Remove from trash list      │
    └─────────────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
AdminProductsPage
├── Header
│   ├── Title: "Gestion des Produits"
│   ├── Count Badge
│   └── "Ajouter produit" Button (only in Produits tab)
│
├── Tabs
│   ├── 📦 Produits Tab (activeTab === 'products')
│   │   ├── Badge: {products.length}
│   │   └── Active when viewing normal products
│   │
│   └── 🗑️ Corbeille Tab (activeTab === 'trash')
│       ├── Badge: {trashProducts.length} (red if > 0)
│       └── Active when viewing trash
│
├── Produits Tab Content (when activeTab === 'products')
│   ├── Filters
│   │   ├── Show Inactive Toggle
│   │   ├── Color Filter
│   │   └── Size Filter
│   │
│   └── Product Cards
│       ├── Image
│       ├── Code + Name + Color
│       ├── Stock Info
│       └── Actions
│           ├── ✏️ Edit Button
│           └── 🗑️ Delete Button → handleDelete()
│
├── Corbeille Tab Content (when activeTab === 'trash')
│   ├── Empty State (if no trash)
│   │   ├── 🗑️ Icon
│   │   └── "La corbeille est vide"
│   │
│   └── Trash Product Cards
│       ├── Image (faded)
│       ├── Code + Name + Color
│       ├── Deletion Info
│       │   ├── 📅 Deleted: {date}
│       │   ├── 👤 By: {admin.name}
│       │   └── 📝 Reason: {reason}
│       │
│       ├── Order Summary
│       │   ├── 🟡 {count} en attente
│       │   ├── 🔵 {count} en cours
│       │   ├── 🟢 {count} livrées
│       │   └── ⚪ {count} annulées
│       │
│       └── Actions
│           ├── 🔄 Restaurer Button → handleRestore()
│           └── 🗑️ Supprimer définitivement → handlePermanentDelete()
│
└── Modals
    ├── Edit/Create Modal
    │   └── (existing modal for product creation/editing)
    │
    ├── Confirm Delete Modal (from useCustomAlert)
    │   └── Simple yes/no confirmation
    │
    └── DeleteConfirmModal (BlockingOrdersModal)
        ├── Header
        │   ├── ⚠️ Warning Icon
        │   └── "Attention: Commandes en cours"
        │
        ├── Product Info
        │   └── "Produit: {name}"
        │
        ├── Alert Box (yellow)
        │   └── "Ce produit a {count} commandes actives"
        │
        ├── Blocking Orders List (scrollable)
        │   └── For each order:
        │       ├── Order ID
        │       ├── Status Badge (color-coded)
        │       ├── Client Name
        │       └── Total Amount
        │
        ├── Options
        │   ├── Option A (Red/Danger)
        │   │   ├── Icon: ⚠️
        │   │   ├── Text: "Supprimer commandes + produit"
        │   │   ├── Subtext: "Supprime définitivement..."
        │   │   └── onClick → handleDeleteWithOrders()
        │   │
        │   └── Option B (Gray/Safe)
        │       ├── Icon: 📦
        │       ├── Text: "Garder dans la corbeille"
        │       ├── Subtext: "Le produit restera..."
        │       └── onClick → handleKeepInTrash()
        │
        └── Footer
            └── Cancel Button → close modal
```

---

## 🎯 Status Badge Color Coding

```
Order Status → Badge Color → Meaning
─────────────────────────────────────

EN_ATTENTE  →  🟡 Yellow  →  Pending/Waiting
                bg-yellow-100
                text-yellow-800

EN_COURS    →  🔵 Blue    →  In Progress
                bg-blue-100
                text-blue-800

LIVRE       →  🟢 Green   →  Delivered
                bg-green-100
                text-green-800

ANNULE      →  ⚪ Gray    →  Cancelled
                bg-gray-100
                text-gray-800
```

---

## 📡 API Response Structures

### DELETE /products/:id
```typescript
// Case 1: Product has orders/returns
{
  action: 'moved_to_trash',
  message: 'Produit déplacé vers l\'historique de suppression'
}

// Case 2: Product not used anywhere
{
  action: 'deleted',
  message: 'Produit supprimé définitivement'
}
```

### GET /products/trash/list
```typescript
[
  {
    id: 5,
    code: 'TS-BLA-S',
    name: 'T-Shirt Standard',
    color: 'Blanc',
    isDeleted: true,
    deletedAt: '2026-01-28T15:30:00Z',
    deletedBy: 'uuid-admin-123',
    category: { id: 1, name: 'T-Shirts' },
    images: [...],
    deletionRequest: {
      id: 'uuid-request-456',
      status: 'PENDING',
      reason: 'Produit utilisé dans des commandes',
      createdAt: '2026-01-28T15:30:00Z',
      admin: {
        id: 'uuid-admin-123',
        email: 'admin@example.com',
        name: 'Admin User'
      }
    },
    variants: [
      {
        id: 10,
        size: { name: 'S' },
        orderItems: [
          { 
            order: { 
              id: 100, 
              status: 'EN_COURS',
              client: { name: 'John Doe' },
              totalAmount: 25.00
            } 
          }
        ],
        customOrderItems: [...],
        returnItemsNew: [...]
      }
    ]
  }
]
```

### DELETE /products/:id/permanent
```typescript
// Case 1: Blocked by active orders
{
  action: 'blocked',
  message: 'Cannot delete...',
  blockingOrders: [
    {
      id: 100,
      status: 'EN_COURS',
      client: { name: 'John Doe' },
      totalAmount: 25.00,
      createdAt: '2026-01-20T10:00:00Z'
    }
  ],
  options: [
    'Delete product and all related orders',
    'Keep product in trash'
  ]
}

// Case 2: Allowed (all orders completed/cancelled)
{
  action: 'deleted_permanently',
  message: 'Produit supprimé définitivement'
}
```

### DELETE /products/:id/permanent-with-orders
```typescript
{
  action: 'deleted_orders_and_product',
  message: 'Produit et commandes supprimés',
  deletedOrders: 3,
  deletedCustomOrders: 1
}
```

---

## 🔐 Database State Transitions

```
Product Lifecycle States:
─────────────────────────

┌─────────────────┐
│   ACTIVE        │  isDeleted=false, isActive=true
│  (Normal List)  │
└────────┬────────┘
         │
         │ User clicks DELETE
         │ Product has orders
         ▼
┌─────────────────┐
│   TRASH         │  isDeleted=true, isActive=false
│  (Corbeille)    │  deletedAt=timestamp
└────────┬────────┘  deletedBy=adminId
         │
    ┌────┴────┐
    │         │
    │ RESTORE │ PERMANENT DELETE
    │         │
    ▼         ▼
┌────────┐  ┌────────────────┐
│ ACTIVE │  │ DELETED        │  Removed from DB
│        │  │ (No Recovery)  │
└────────┘  └────────────────┘
```

---

## 💾 Database Cascade Delete Order

When permanently deleting a product:

```
1. ReturnItems       ─┐
2. Returns           ─┤
3. OrderItems        ─┤
4. Orders            ─┤  Related to variants
5. CustomOrderItems  ─┤
6. CustomOrders      ─┤
7. CartItems         ─┘
                      
8. StockMovements    ─┐
9. ProductImages     ─┤  Directly related to product
10. ProductVariants  ─┤
11. DeletionRequest  ─┘
                      
12. Product          ─── Main record
```

**Important**: Cascade deletes happen in transactions to ensure atomicity.

---

## 🚦 Decision Tree for Product Deletion

```
                    User clicks DELETE
                            │
                            ▼
                Does product have variants?
                            │
                    ┌───────┴────────┐
                   YES              NO
                    │                │
                    ▼                ▼
        Are variants used in    Delete product
        orders/returns/carts?   immediately
                    │            (no variants)
            ┌───────┴────────┐
           YES              NO
            │                │
            ▼                ▼
    SOFT DELETE          HARD DELETE
    Move to trash        Remove from DB
    (keep for audit)     (clean removal)
            │                │
            └────────┬───────┘
                     │
                     ▼
            Return appropriate
            action to frontend
```

---

## 📱 Frontend State Management

```typescript
State Variables:
────────────────

activeTab: 'products' | 'trash'
  - Controls which tab content is shown
  - Changes URL path or query param

products: Product[]
  - Active products (isDeleted=false)
  - Fetched via: productsApi.getAll(undefined, showInactive, false)

trashProducts: any[]
  - Deleted products (isDeleted=true)
  - Fetched via: productsApi.getTrash()

showDeleteModal: boolean
  - Controls visibility of DeleteConfirmModal
  - True when permanent delete is blocked

deleteModalData: { productId, productName, blockingOrders }
  - Data passed to modal
  - Contains orders that block deletion

showInactive: boolean
  - Filter toggle for inactive products
  - Affects products list only, not trash
```

---

**Last Updated**: January 28, 2026
**Status**: ✅ Fully Implemented & Running
