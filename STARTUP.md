# Backend & Frontend Startup Guide

## Quick Start

### Option 1: Automatic (Run Both Servers)

Open PowerShell and run:
```powershell
cd C:\Users\Sohib\stage-pino
.\start-all.bat
```

### Option 2: Manual (Separate Terminals)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Sohib\stage-pino\Backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\Sohib\stage-pino\Frontend
npm run dev
```

## Accessing the Application

- **Frontend**: http://localhost:3000
  - Boutique: http://localhost:3000/boutique
  - Admin Products: http://localhost:3000/admin/products
  
- **Backend API**: http://localhost:3001
  - Products API: http://localhost:3001/products
  - Categories API: http://localhost:3001/products/categories

## Troubleshooting

### Port Already in Use

If you get "EADDRINUSE" error:

```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Wait 2 seconds, then restart
```

### Database Connection Issues

Make sure PostgreSQL is running and the `.env` file has the correct `DATABASE_URL`.

### Products Not Loading

1. Make sure backend is running on port 3001
2. Check browser console for errors
3. Verify CORS is enabled (it should be by default)

## API Endpoints

### Products
- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `GET /products/slug/:slug` - Get product by slug
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Categories
- `GET /products/categories` - List all categories
- `GET /products/categories/:id` - Get category by ID  
- `POST /products/categories` - Create category
- `DELETE /products/categories/:id` - Delete category

### Variants
- `PUT /products/variants/:id/stock` - Update variant stock
- `GET /products/variants/:id/stock` - Get variant stock history
