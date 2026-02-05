# 🎨 Boutique Visual Reference

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (Fixed)                        │
│  [Logo]    Personnaliser  Boutique  Grandes commandes   │
│                              Se connecter  [S'inscrire]  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     HERO SECTION                         │
│              🛍️ Livraison rapide • Qualité garantie      │
│                                                          │
│                  Notre Boutique                          │
│                        ~~~~~~~                           │
│     Découvrez notre sélection de produits premium       │
│              personnalisables. Qualité                   │
│             professionnelle garantie.                    │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    FILTERS SECTION                       │
│  🔍 [Search bar]                                        │
│                                                          │
│  [Tous] [T-shirts] [Sweats] [Casquettes] [Accessoires] │
│                                      8 produits [Sort ▼]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   PRODUCTS GRID (4 cols)                 │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ ⭐      │  │        │  │        │  │        │       │
│  │[IMAGE] │  │[IMAGE] │  │[IMAGE] │  │[IMAGE] │       │
│  │        │  │        │  │        │  │        │       │
│  │T-SHIRTS│  │ SWEATS │  │CASQUET.│  │ACCESS. │       │
│  │Product │  │Product │  │Product │  │Product │       │
│  │24.99€  │  │44.99€  │  │19.99€  │  │12.99€  │       │
│  │[🛒]    │  │[🛒]    │  │[🛒]    │  │[🛒]    │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ ⭐      │  │        │  │        │  │        │       │
│  │[IMAGE] │  │[IMAGE] │  │[IMAGE] │  │[IMAGE] │       │
│  │        │  │        │  │        │  │        │       │
│  │ACCESS. │  │T-SHIRTS│  │ SWEATS │  │CASQUET.│       │
│  │Product │  │Product │  │Product │  │Product │       │
│  │14.99€  │  │29.99€  │  │39.99€  │  │17.99€  │       │
│  │[🛒]    │  │[🛒]    │  │[🛒]    │  │[🛒]    │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CTA SECTION (Blue)                    │
│                                                          │
│      Vous ne trouvez pas ce que vous cherchez ?         │
│     Personnalisez vos propres produits avec notre       │
│                  outil de design                         │
│                                                          │
│              [Créer mon design →]                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Product Card (Hover States)

### Normal State
```
┌──────────────────────┐
│  ⭐ Populaire        │ ← Badge (if featured)
│                      │
│                      │
│     [PRODUCT]        │ ← Product image
│      [IMAGE]         │
│                      │
│                      │
├──────────────────────┤
│ T-SHIRTS    ●●●●    │ ← Category & Colors
│                      │
│ T-shirt Premium      │ ← Product name
│ Pino                 │
│                      │
│ 24.99€      [🛒]    │ ← Price & Cart button
│ 6 tailles            │
└──────────────────────┘
```

### Hover State
```
┌──────────────────────┐
│  ⭐ Populaire        │
│                      │
│  ╔════════════════╗  │
│  ║   [ZOOMED]    ║  │ ← Image zooms 1.1x
│  ║   [IMAGE]     ║  │
│  ║               ║  │
│  ║ [Voir détails]║  │ ← Overlay button
│  ╚════════════════╝  │
├──────────────────────┤
│ T-SHIRTS    ●●●●    │
│                      │
│ T-shirt Premium      │ ← Name turns blue
│ Pino                 │
│                      │
│ 24.99€      [🛒]    │ ← Cart scales up
│ 6 tailles            │
└──────────────────────┘
  ↑ Card lifts up slightly
  ↑ Shadow increases
```

## Product Modal

### Desktop View
```
┌─────────────────────────────────────────────────────┐
│                                              [X]    │
│                                                     │
│  ┌──────────────┐   ┌──────────────────────────┐  │
│  │              │   │ [T-SHIRTS] ⭐ Populaire   │  │
│  │   MAIN       │   │                           │  │
│  │   IMAGE      │   │ T-shirt Premium Pino      │  │
│  │              │   │                           │  │
│  │              │   │ 24.99€                    │  │
│  └──────────────┘   │ TVA incluse • Livraison…  │  │
│                     │                           │  │
│  [📷][📷][📷][📷]   │ Description text here...  │  │
│   Thumbnails        │                           │  │
│                     │ Couleur: Blanc            │  │
│                     │ [⬜][⬛][🟦][⬜]          │  │
│                     │                           │  │
│                     │ Taille: M                 │  │
│                     │ [XS][S][M][L][XL][XXL]    │  │
│                     │                           │  │
│                     │ Quantité                  │  │
│                     │  [-]  1  [+]             │  │
│                     │                           │  │
│                     │ [Ajouter au panier]       │  │
│                     │ [Personnaliser ce produit]│  │
│                     │                           │  │
│                     │ ✓ Qualité professionnelle │  │
│                     │ ⏰ Livraison 3-5 jours    │  │
│                     │ ↻ Retour gratuit 30 jours │  │
│  └──────────────┘   └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Desktop (1280px+)
```
[Product] [Product] [Product] [Product]
[Product] [Product] [Product] [Product]
         4 columns grid
```

### Laptop (1024px - 1279px)
```
[Product] [Product] [Product]
[Product] [Product] [Product]
       3 columns grid
```

### Tablet (640px - 1023px)
```
[Product] [Product]
[Product] [Product]
   2 columns grid
```

### Mobile (< 640px)
```
[Product]
[Product]
[Product]
1 column stack
```

## Color Palette

```
Primary Blue:     #4AC4E5  ████████
Blue Light:       #6FD4ED  ████████
Blue Dark:        #2BAED1  ████████
Blue Subtle:      #E6F7FC  ████████

Gray 900:         #111827  ████████
Gray 600:         #4B5563  ████████
Gray 100:         #F3F4F6  ████████
White:            #FFFFFF  ████████
```

## Interactive States

### Buttons
```
Normal:     [Se connecter]
Hover:      [Se connecter]  ← Slightly darker
Active:     [Se connecter]  ← Scale down 98%

Primary:    [S'inscrire]    ← Blue background
Hover:      [S'inscrire]    ← Darker blue + scale 105%
```

### Product Card
```
Normal:     transform: scale(1) translateY(0)
            shadow: md
            
Hover:      transform: scale(1) translateY(-4px)
            shadow: xl
            image: scale(1.1)
```

### Category Pills
```
Inactive:   bg-white border-gray-200 text-gray-700
Hover:      border-pino-blue text-pino-blue
Active:     bg-pino-blue text-white shadow-pino
```

## Animations Timeline

### Page Load
```
0ms:    Hero section fades in
100ms:  Search bar slides up
200ms:  Category filters appear
300ms:  Products start appearing
350ms:  Product card 1 fades in
400ms:  Product card 2 fades in
450ms:  Product card 3 fades in
...     Staggered 50ms delays
```

### Modal Open
```
0ms:    Background overlay fades in
100ms:  Modal slides up from bottom
200ms:  Content becomes interactive
```

### Hover Interactions
```
Duration: 200-300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Properties: transform, box-shadow, colors
```

## Empty State

```
┌─────────────────────────────────────┐
│                                     │
│           ( ⚈ ̫ ⚈ )                 │
│                                     │
│      Aucun produit trouvé          │
│                                     │
│  Essayez de modifier vos filtres   │
│      ou votre recherche             │
│                                     │
│    [Réinitialiser les filtres]     │
│                                     │
└─────────────────────────────────────┘
```

## Loading States

### Product Card Loading
```
┌──────────────────────┐
│                      │
│       ⟲              │ ← Spinning loader
│    Loading...        │
│                      │
├──────────────────────┤
│ Shimmer animation    │
│ ▓▓▓▓▓▓░░░░░░        │
└──────────────────────┘
```

### Image Loading
```
Before load:  [Spinner]
After load:   [Image fades in]
On error:     [Gradient placeholder + icon]
```

## Typography Scale

```
Hero Title:     text-6xl (60px) font-bold
Section Title:  text-4xl (36px) font-bold
Product Name:   text-lg (18px) font-semibold
Price:          text-2xl (24px) font-bold
Body:           text-base (16px)
Small:          text-sm (14px)
Tiny:           text-xs (12px)
```

## Spacing System

```
Component Padding:  p-5  (20px)
Section Padding:    py-12 (48px vertical)
Card Gap:           gap-6 (24px)
Button Padding:     px-6 py-3 (24px × 12px)
Modal Padding:      p-8 (32px)
```

## Shadow System

```
Card Normal:    shadow-md
Card Hover:     shadow-xl
Button:         shadow-pino (custom blue shadow)
Modal:          shadow-2xl
```

---

This visual reference helps understand the boutique's layout and interactions!
