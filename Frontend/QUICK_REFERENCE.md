# Pino Design Quick Reference Card

## 🎨 Colors (Copy & Paste Ready)

```css
/* Primary Brand Colors */
--pino-blue:        #4AC4E5
--pino-blue-light:  #6FD4ED
--pino-blue-dark:   #2BAED1
--pino-blue-subtle: #E6F7FC

/* Neutrals */
--white:    #FFFFFF
--gray-50:  #F9FAFB
--gray-100: #F3F4F6
--gray-600: #4B5563
--gray-900: #111827
```

## 📏 Typography

```css
/* Font Families */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;

/* Sizes */
Hero:    56px / 3.5rem    (font-weight: 700)
H1:      48px / 3rem      (font-weight: 700)
H2:      36px / 2.25rem   (font-weight: 600)
Body Lg: 20px / 1.25rem   (font-weight: 400)
Body:    16px / 1rem      (font-weight: 400)
Small:   14px / 0.875rem  (font-weight: 400)
```

## 🔲 Spacing

```
xs:  8px   (0.5rem)
sm:  12px  (0.75rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

## 🎯 Shadows

```css
/* Card */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Button (Pino) */
box-shadow: 0 4px 12px rgba(74, 196, 229, 0.3);

/* Button Hover */
box-shadow: 0 6px 16px rgba(74, 196, 229, 0.4);

/* Header Scroll */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

## 📐 Border Radius

```
sm:     4px
md:     8px   ← Standard
lg:     12px
xl:     16px
full:   50% / 9999px
```

## ⚡ Transitions

```css
/* Fast */
transition: all 0.15s ease;

/* Medium (Standard) */
transition: all 0.2s ease;

/* Slow */
transition: all 0.3s ease;
```

## 🎨 Button Styles

### Primary Button
```css
background: #4AC4E5;
color: #FFFFFF;
padding: 16px 32px;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(74, 196, 229, 0.3);
transition: all 0.2s ease;

/* Hover */
background: #2BAED1;
box-shadow: 0 6px 16px rgba(74, 196, 229, 0.4);
transform: scale(1.05);
```

### Secondary Button
```css
background: #FFFFFF;
color: #4AC4E5;
border: 2px solid #4AC4E5;
padding: 14px 30px; /* Adjusted for border */
border-radius: 8px;
transition: all 0.2s ease;

/* Hover */
background: #F0FBFF;
border-color: #2BAED1;
transform: scale(1.05);
```

## 📱 Breakpoints

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Wide */
@media (min-width: 1280px) { }
```

## 🎯 Common Patterns

### Hover Effect
```css
.element {
  transition: all 0.2s ease;
}
.element:hover {
  color: #4AC4E5;
  transform: scale(1.02);
}
```

### Underline Animation
```css
.link {
  position: relative;
}
.link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: #4AC4E5;
  transition: width 0.2s ease;
}
.link:hover::after {
  width: 100%;
}
```

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in {
  animation: fadeIn 0.6s ease-out;
}
```

### Slide Up
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.slide-up {
  animation: slideUp 0.6s ease-out;
}
```

## 🔍 Accessibility

```css
/* Focus State */
:focus-visible {
  outline: 2px solid #4AC4E5;
  outline-offset: 2px;
}

/* Minimum Touch Target */
min-width: 44px;
min-height: 44px;

/* Color Contrast */
/* All text meets WCAG AA (4.5:1) */
```

## 📐 Layout Maximums

```
Container Max Width: 1280px (7xl)
Content Max Width:   1024px (4xl)
Text Max Width:      800px  (3xl)
```

## 🎨 Gradient

```css
/* Hero Background */
background: linear-gradient(to bottom, #F9FAFB, #FFFFFF);

/* Logo/Icon */
background: linear-gradient(135deg, #4AC4E5, #2BAED1);
```

## 📊 Component Heights

```
Header:       80px
Button:       56px (large CTA)
              40px (standard)
Input:        48px
Nav Link:     auto (with padding)
```

---

## 🚀 Quick Start Tailwind Classes

```html
<!-- Primary Button -->
<button class="px-8 py-4 bg-pino-blue text-white font-semibold rounded-lg hover:bg-pino-blue-dark transform hover:scale-105 transition-all duration-200 shadow-pino">
  Click me
</button>

<!-- Secondary Button -->
<button class="px-8 py-4 bg-white text-pino-blue font-semibold rounded-lg border-2 border-pino-blue hover:bg-pino-blue/5 transform hover:scale-105 transition-all duration-200">
  Click me
</button>

<!-- Card -->
<div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
  Content
</div>

<!-- Section -->
<section class="py-20 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    Content
  </div>
</section>
```

---

**Print or keep this card handy for quick reference while coding!**
