# Pino - Design System & UI/UX Guidelines

## Brand Overview
**Business**: Digital printing specializing in custom apparel and personalized clothing  
**Target**: Individuals, small businesses, and companies ordering custom apparel  
**Positioning**: Professional, creative, premium digital printing services

---

## Color Palette

### Primary Colors
- **Pino Blue**: `#4AC4E5` - Main brand color, used for primary CTAs and accents
- **Pino Blue Light**: `#6FD4ED` - Hover states and highlights
- **Pino Blue Dark**: `#2BAED1` - Active states and depth

### Neutral Colors
- **White**: `#FFFFFF` - Backgrounds, cards
- **Gray 50**: `#F9FAFB` - Light backgrounds
- **Gray 100**: `#F3F4F6` - Borders, dividers
- **Gray 600**: `#4B5563` - Secondary text
- **Gray 900**: `#111827` - Primary text, headings

### Semantic Colors
- **Success**: `#10B981` - Confirmations
- **Warning**: `#F59E0B` - Alerts
- **Error**: `#EF4444` - Errors

---

## Typography

### Font Families
- **Primary**: 'Inter', 'Segoe UI', -apple-system, sans-serif
- **Headings**: 'Poppins', 'Inter', sans-serif (optional enhancement)

### Type Scale
- **Hero Title**: 56px / 3.5rem - Font weight 700 - Line height 1.1
- **H1**: 48px / 3rem - Font weight 700 - Line height 1.2
- **H2**: 36px / 2.25rem - Font weight 600 - Line height 1.3
- **H3**: 24px / 1.5rem - Font weight 600 - Line height 1.4
- **Body Large**: 18px / 1.125rem - Font weight 400 - Line height 1.6
- **Body**: 16px / 1rem - Font weight 400 - Line height 1.5
- **Small**: 14px / 0.875rem - Font weight 400 - Line height 1.5
- **Button**: 16px / 1rem - Font weight 500 - Letter spacing 0.01em

---

## Spacing System
Based on 4px base unit (0.25rem)
- **xs**: 8px (0.5rem)
- **sm**: 12px (0.75rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)

---

## Components

### Navigation Header

**Layout**:
- Height: 80px (desktop), 70px (mobile)
- Max width: 1280px centered
- Padding: 0 32px (desktop), 0 16px (mobile)
- Sticky position with backdrop blur

**Structure**:
```
[Logo] ---------- [Nav Links] ---------- [Auth CTA]
Left               Center                  Right
```

**Navigation Items**:
1. Personnaliser
2. Boutique
3. Grandes commandes

**Behavior**:
- Sticky header with subtle shadow on scroll
- Backdrop blur effect (16px)
- Smooth transitions (200ms ease)
- Hamburger menu on mobile (<768px)

---

### Hero Section

**Layout**:
- Height: 600px (desktop), auto (mobile)
- Max width: 1280px centered
- Padding: 80px 32px

**Content Hierarchy**:
1. Main headline (Hero Title size)
2. Subheadline (Body Large)
3. CTA buttons (primary + secondary)
4. Optional: Background image or gradient

**CTA Buttons**:
- **Primary**: Solid Pino Blue background, white text
- **Secondary**: White background, Pino Blue border and text
- Spacing: 16px gap between buttons
- Height: 56px
- Padding: 0 32px
- Border radius: 8px

---

### Button Variants

#### Primary Button
- Background: `#4AC4E5`
- Text: `#FFFFFF`
- Hover: `#2BAED1`
- Shadow: `0 4px 12px rgba(74, 196, 229, 0.3)`
- Hover shadow: `0 6px 16px rgba(74, 196, 229, 0.4)`

#### Secondary Button
- Background: `#FFFFFF`
- Border: 2px solid `#4AC4E5`
- Text: `#4AC4E5`
- Hover background: `#F0FBFF`
- Hover border: `#2BAED1`

#### Link/Ghost Button
- Background: transparent
- Text: `#4B5563`
- Hover text: `#111827`
- Underline on hover

---

## Effects & Animations

### Shadows
- **Card**: `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`
- **Card Hover**: `0 10px 25px rgba(0, 0, 0, 0.15)`
- **Button**: `0 4px 12px rgba(74, 196, 229, 0.3)`
- **Header Scroll**: `0 2px 8px rgba(0, 0, 0, 0.1)`

### Border Radius
- **Small**: 4px
- **Medium**: 8px
- **Large**: 12px
- **XLarge**: 16px

### Transitions
- **Fast**: 150ms ease
- **Medium**: 200ms ease
- **Slow**: 300ms ease

### Hover Effects
- Scale: 1.02 (subtle lift)
- Brightness increase
- Shadow enhancement
- Color shifts (darker/lighter by 10-15%)

---

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Wide**: > 1280px

### Mobile Adaptations
- Hamburger menu replaces horizontal nav
- Hero section stacks vertically
- Font sizes reduced by 15-20%
- Padding reduced to 16px
- Button width: full-width or auto

---

## Accessibility

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Focus States**: Visible 2px outline with Pino Blue
- **Keyboard Navigation**: Full support for tab navigation
- **Screen Readers**: Semantic HTML with ARIA labels where needed
- **Touch Targets**: Minimum 44x44px for mobile

---

## Best Practices

1. **White Space**: Use generous spacing to create breathing room
2. **Visual Hierarchy**: Clear distinction between primary and secondary content
3. **Consistency**: Use design tokens consistently across all components
4. **Performance**: Optimize images, use web fonts efficiently
5. **Progressive Enhancement**: Core functionality works without JavaScript
