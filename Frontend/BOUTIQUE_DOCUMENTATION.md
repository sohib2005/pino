# 🛍️ Boutique Pino - Documentation

## 📋 Overview

The Boutique section is a premium, modern e-commerce product catalog built with Next.js 14, TypeScript, and Tailwind CSS. It perfectly matches the Pino brand identity with smooth animations, professional design, and exceptional UX.

## ✨ Features Implemented

### 🎨 Design & UX
- **Premium Visual Identity**: Matches homepage with Pino blue (#4AC4E5) color scheme
- **Modern Card Layout**: Smooth rounded cards with soft shadows and hover effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Professional Animations**: 
  - Image zoom on hover
  - Smooth transitions and scale effects
  - Fade-in animations with staggered delays
  - Modal animations

### 🔍 Advanced Filtering
- **Category Filter**: T-shirts, Sweats, Casquettes, Accessoires
- **Search Bar**: Real-time product search
- **Sort Options**:
  - Par défaut (Featured first)
  - Prix croissant (Low to High)
  - Prix décroissant (High to Low)
  - Nom A-Z (Alphabetical)
- **Active Filters Display**: Shows current filters with one-click removal

### 🛒 Product Features
- **Product Cards**:
  - High-quality image with zoom effect
  - Product name, category, and price
  - Color preview dots
  - "Populaire" badge for featured items
  - Quick "Add to Cart" button
  - "Voir détails" overlay on hover

- **Product Modal**:
  - Image gallery with thumbnails
  - Size selection (interactive buttons)
  - Color selection (visual color swatches)
  - Quantity selector
  - Product description
  - Trust indicators (quality, delivery, returns)
  - "Personnaliser ce produit" option
  - Full product details

### 🎯 Empty State
- Beautiful empty state UI when no products match filters
- One-click filter reset button
- Friendly messaging

### 📱 Responsive Features
- Mobile-optimized filter layout
- Touch-friendly buttons and interactions
- Adaptive grid (1 → 2 → 3 → 4 columns)
- Scrollable modal on small screens

## 📁 File Structure

```
app/
├── boutique/
│   └── page.tsx              # Main boutique page with product data
├── components/
│   ├── ProductCard.tsx       # Individual product card component
│   ├── ProductFilter.tsx     # Filter and sort controls
│   ├── ProductModal.tsx      # Product detail modal
│   ├── Header.tsx           # Navigation (already existed)
│   └── ...
└── globals.css              # Enhanced with new animations
```

## 🛠️ Components

### BoutiquePage (`app/boutique/page.tsx`)
Main page component with:
- Product data array (8 sample products)
- State management for filters, sort, and modal
- Product filtering and sorting logic
- Responsive grid layout
- CTA section for personalization

### ProductCard (`app/components/ProductCard.tsx`)
Reusable product card with:
- Image loading states
- Error handling with fallback
- Color preview visualization
- Hover effects and animations
- Quick add to cart functionality

### ProductFilter (`app/components/ProductFilter.tsx`)
Advanced filtering interface with:
- Search input
- Category pills
- Sort dropdown
- Active filters display
- Product count

### ProductModal (`app/components/ProductModal.tsx`)
Full product details modal with:
- Image gallery
- Size/color/quantity selection
- Add to cart functionality
- Product customization link
- Trust badges

## 🎨 Design System

### Colors
```css
--pino-blue: #4AC4E5
--pino-blue-light: #6FD4ED
--pino-blue-dark: #2BAED1
--pino-blue-subtle: #E6F7FC
```

### Shadows
```css
--shadow-pino: 0 4px 12px rgba(74, 196, 229, 0.3)
--shadow-pino-lg: 0 6px 16px rgba(74, 196, 229, 0.4)
```

### Typography
- Font Family: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto')
- Headlines: Bold, 4xl-6xl
- Body: Regular, lg-xl
- Small text: sm-xs

### Spacing
- Cards: p-5 (20px)
- Sections: py-12 (48px)
- Grid gap: gap-6 (24px)

## 📸 Product Images Setup

The boutique uses placeholder image paths. To add real images:

1. **Create these folders** in `public/imgs/`:
   ```
   public/imgs/
   ├── tshirt-1.jpg
   ├── tshirt-1-back.jpg
   ├── hoodie-1.jpg
   ├── hoodie-1-detail.jpg
   ├── cap-1.jpg
   ├── cap-1-side.jpg
   ├── mug-1.jpg
   ├── mug-1-detail.jpg
   ├── tote-1.jpg
   ├── tote-1-full.jpg
   ├── polo-1.jpg
   ├── polo-1-detail.jpg
   ├── sweat-1.jpg
   ├── sweat-1-back.jpg
   ├── dad-hat-1.jpg
   └── dad-hat-1-side.jpg
   ```

2. **Image Requirements**:
   - Format: JPG or PNG
   - Aspect ratio: 1:1 (square)
   - Recommended size: 800x800px minimum
   - White or transparent background preferred
   - High quality, professional product photography

3. **Fallback Handling**:
   - If images fail to load, cards show a gradient placeholder
   - Product name is displayed in the placeholder
   - No broken image icons

## 🚀 Usage

### Navigate to Boutique
```
http://localhost:3000/boutique
```

### Adding New Products
Edit `app/boutique/page.tsx`:

```typescript
const products: Product[] = [
  {
    id: 9,
    name: 'Your Product Name',
    category: 'T-shirts', // or 'Sweats', 'Casquettes', 'Accessoires'
    price: 29.99,
    image: '/imgs/your-image.jpg',
    description: 'Product description...',
    colors: ['Blanc', 'Noir', 'Bleu'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/imgs/your-image.jpg', '/imgs/your-image-2.jpg'],
    featured: true, // Optional: shows "Populaire" badge
  },
  // ... existing products
];
```

### Customizing Categories
Edit the `categories` array in `BoutiquePage`:

```typescript
const categories = ['Tous', 'T-shirts', 'Sweats', 'Casquettes', 'Accessoires', 'New Category'];
```

## 🎯 Performance Optimizations

- **Image Loading**: Progressive loading with loading states
- **Animations**: CSS-based, GPU-accelerated
- **Filtering**: useMemo for optimized recalculation
- **Code Splitting**: Component-level imports
- **No External Dependencies**: Pure React + Tailwind

## 🔒 Accessibility

- ✅ Keyboard navigation
- ✅ Focus visible states
- ✅ ARIA labels
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA compliant)
- ✅ Screen reader friendly

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
```

## 🎨 Animation Classes

Custom animations available:
```css
.animate-fade-in       /* Fade in effect */
.animate-slide-up      /* Slide up with fade */
.animation-delay-100   /* 100ms delay */
.animation-delay-200   /* 200ms delay */
.animation-delay-300   /* 300ms delay */
```

## 🐛 Known Issues & Solutions

### Images Not Loading
- Check that images exist in `public/imgs/`
- Verify image paths are correct
- Fallback placeholder will display automatically

### TypeScript Errors
- Run `npm run build` to clear cache
- Restart TypeScript server in VS Code

### Modal Scroll Issues
- Body scroll is automatically prevented when modal opens
- Cleanup happens on modal close

## 🔮 Future Enhancements

Potential features to add:
- [ ] Shopping cart state management
- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Size guide modal
- [ ] Stock availability indicator
- [ ] Multiple image views (360° rotation)
- [ ] Price range filter
- [ ] Related products
- [ ] Recently viewed items
- [ ] Backend integration (API)

## 🎓 Best Practices

1. **Always use the existing color palette** (pino-blue variants)
2. **Maintain consistent spacing** (use Tailwind spacing scale)
3. **Test on mobile devices** before deploying
4. **Optimize images** before adding to public folder
5. **Follow accessibility guidelines**
6. **Use semantic HTML elements**
7. **Add loading states** for async operations

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review component comments
3. Check browser console for errors
4. Verify image paths and product data

---

Built with ❤️ using Next.js 14 + TypeScript + Tailwind CSS
