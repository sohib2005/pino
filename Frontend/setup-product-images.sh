#!/bin/bash

# Pino Boutique - Product Images Setup Script
# This script creates placeholder images for the boutique

echo "🎨 Creating placeholder images for Pino Boutique..."
echo ""

# Create imgs directory if it doesn't exist
mkdir -p public/imgs

# Define colors
BLUE="#4AC4E5"
DARK="#2BAED1"
LIGHT="#E6F7FC"

# Note: This is a reference script. You'll need to add actual product images.
# Below are the required image files:

cat << 'EOF'
📸 REQUIRED PRODUCT IMAGES
==========================

Please add the following images to public/imgs/:

T-SHIRTS & POLOS:
----------------
✓ tshirt-1.jpg         (Front view of white/light t-shirt)
✓ tshirt-1-back.jpg    (Back view of same t-shirt)
✓ polo-1.jpg           (Front view of polo shirt)
✓ polo-1-detail.jpg    (Close-up of polo collar/fabric)

SWEATS & HOODIES:
----------------
✓ hoodie-1.jpg         (Front view of hoodie)
✓ hoodie-1-detail.jpg  (Close-up of hoodie pocket/fabric)
✓ sweat-1.jpg          (Front view of crewneck sweatshirt)
✓ sweat-1-back.jpg     (Back view of sweatshirt)

CAPS:
----
✓ cap-1.jpg            (Front view of snapback cap)
✓ cap-1-side.jpg       (Side view of cap)
✓ dad-hat-1.jpg        (Front view of dad hat)
✓ dad-hat-1-side.jpg   (Side view of dad hat)

ACCESSORIES:
-----------
✓ mug-1.jpg            (White ceramic mug)
✓ mug-1-detail.jpg     (Close-up of mug handle/surface)
✓ tote-1.jpg           (Canvas tote bag front)
✓ tote-1-full.jpg      (Full tote bag view)

IMAGE SPECIFICATIONS:
====================
• Format: JPG or PNG (JPG preferred for photos)
• Size: 800x800px minimum (1200x1200px recommended)
• Aspect ratio: 1:1 (square)
• Background: White, light gray, or transparent
• Quality: High-resolution, professional product photography
• File size: < 500KB per image (optimized for web)

PHOTOGRAPHY TIPS:
=================
✓ Use natural or soft lighting
✓ Keep consistent background across all products
✓ Center the product in the frame
✓ Show product from flattering angle
✓ Ensure colors are accurate
✓ No shadows or harsh lighting
✓ Clean, wrinkle-free products
✓ High contrast for visibility

QUICK SETUP (Option 1 - Use Existing Images):
=============================================
If you have product images:
1. Rename them according to the list above
2. Copy them to public/imgs/
3. Ensure they're square (1:1 aspect ratio)
4. Optimize file sizes using tools like TinyPNG

QUICK SETUP (Option 2 - Free Stock Photos):
==========================================
Use free stock photos from:
• Unsplash.com (search "white t-shirt", "hoodie", etc.)
• Pexels.com
• Pixabay.com

Download, rename, and place in public/imgs/

QUICK SETUP (Option 3 - Generate Placeholders):
==============================================
Use placeholder services temporarily:
• https://placehold.co/800x800/4AC4E5/white?text=T-Shirt
• https://via.placeholder.com/800x800/4AC4E5/FFFFFF?text=Product

Or use the built-in fallback (products will show with gradient backgrounds)

EOF

echo ""
echo "✅ Setup guide complete!"
echo ""
echo "Next steps:"
echo "1. Add product images to public/imgs/"
echo "2. Verify images load correctly at http://localhost:3000/boutique"
echo "3. Adjust product data in app/boutique/page.tsx if needed"
echo ""
