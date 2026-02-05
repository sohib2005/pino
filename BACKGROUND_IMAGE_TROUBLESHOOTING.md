# 🔍 Background Image Troubleshooting Guide

## 1️⃣ VERIFY IMAGE LOCATION (MOST CRITICAL)

**Run this command in PowerShell:**
```powershell
Get-ChildItem -Path "Frontend\public\imgs\backgrounds\" -Recurse | Select-Object FullName, Name, Extension, Length
```

**✅ CORRECT location:**
```
Frontend/public/imgs/backgrounds/shopping-hero.jpg
```

**❌ WRONG locations:**
- Frontend/app/imgs/backgrounds/shopping-hero.jpg
- Frontend/src/imgs/backgrounds/shopping-hero.jpg
- Backend/public/imgs/backgrounds/shopping-hero.jpg

---

## 2️⃣ DIRECT BROWSER TEST (100% PROOF)

**Open this URL in your browser:**
```
http://localhost:3000/imgs/backgrounds/shopping-hero.jpg
```

**What should happen:**
- ✅ Image displays = Path is correct
- ❌ 404 error = Image not in /public or wrong path
- ❌ Server not running = Start dev server first

---

## 3️⃣ EXACT FILENAME CHECK

**Run this command:**
```powershell
Get-Item "Frontend\public\imgs\backgrounds\shopping-hero.*" | Select-Object Name, Extension
```

**Common mistakes:**
- ❌ shopping-hero.jpeg (not .jpg)
- ❌ shopping-hero.png (not .jpg)
- ❌ shopping-hero (no extension)
- ❌ Shopping-hero.jpg (capital S)
- ❌ shopping-hero .jpg (space before extension)

---

## 4️⃣ TEST: IS HERO CONTAINER VISIBLE?

**Temporarily modify the hero section to:**
```tsx
<section 
  className="relative h-[280px] md:h-[360px] lg:h-[420px] pt-20 md:pt-24 overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{ 
    backgroundImage: "url('/imgs/backgrounds/shopping-hero.jpg')",
    backgroundColor: 'red'  // TEST: Should see red if container is visible
  }}
>
```

**Result:**
- ✅ Red appears = Container is visible, image loading issue
- ❌ No red = Container is hidden/collapsed

---

## 5️⃣ CHECK FOR OVERLAY BLOCKING IMAGE

**Current code has this overlay:**
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
```

**This overlay is ABOVE the background but should still let it show through.**

**Test by temporarily commenting it out:**
```tsx
{/* <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div> */}
```

---

## 6️⃣ SERVER RESTART (REQUIRED)

**Stop the dev server (Ctrl+C) and restart:**
```bash
cd Frontend
npm run dev
```

**Why?** Next.js caches /public files. New images need a restart.

---

## 7️⃣ CSS OVERRIDE CHECK

**Look for any of these in global CSS or Tailwind:**
```css
section {
  background: black !important;
}

.relative {
  background-color: black;
}
```

**Check files:**
- Frontend/app/globals.css
- Frontend/tailwind.config.ts

---

## 8️⃣ PARENT CONTAINER CHECK

**The hero is inside:**
```tsx
<>
  <Header />
  <section>  <!-- Hero is here -->
```

**Make sure Header doesn't have:**
- `position: fixed` with high `z-index` covering the hero
- Check Header height doesn't push hero off screen

---

## 🧪 ULTIMATE TEST (100% PROOF)

**Replace the ENTIRE hero section temporarily with this minimal test:**

```tsx
{/* TEMPORARY TEST - Replace hero section */}
<div
  className="h-[300px] mt-20"
  style={{
    backgroundImage: "url('/imgs/backgrounds/shopping-hero.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '10px solid red'
  }}
>
  <h1 className="text-white text-6xl text-center pt-20">TEST</h1>
</div>
```

**What you should see:**
1. Red border (proves div exists)
2. White "TEST" text (proves content renders)
3. Background image behind text

**Results:**
- ✅ Image shows = Original code has issue
- ❌ Only red border + text = Image path/file problem

---

## 📋 COMPLETE DIAGNOSTIC CHECKLIST

Run these commands and paste results:

```powershell
# 1. Check if file exists
Test-Path "Frontend\public\imgs\backgrounds\shopping-hero.jpg"

# 2. Get file details
Get-Item "Frontend\public\imgs\backgrounds\shopping-hero.jpg" -ErrorAction SilentlyContinue | Select-Object Name, Length, Extension, FullName

# 3. List all files in backgrounds folder
Get-ChildItem "Frontend\public\imgs\backgrounds\" -File

# 4. Check if dev server is running
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*3000*"}
```

---

## ✅ CORRECT WORKING CODE

**This is what your boutique/page.tsx hero section should be:**

```tsx
{/* Hero Section */}
<section 
  className="relative h-[280px] md:h-[360px] lg:h-[420px] pt-20 md:pt-24 overflow-hidden bg-gray-900 bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/imgs/backgrounds/shopping-hero.jpg')" }}
>
  {/* Dark Overlay Gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
  
  {/* Decorative Elements */}
  <div className="absolute top-20 right-0 w-96 h-96 bg-pino-blue/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-0 left-0 w-96 h-96 bg-pino-blue/10 rounded-full blur-3xl"></div>
  
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center z-10">
    <div className="text-center max-w-3xl mx-auto">
      <div className="inline-flex items-center px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full mb-4 md:mb-6 shadow-lg">
        <svg className="w-5 h-5 text-pino-blue mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        <span className="text-sm font-medium text-pino-blue">
          Livraison rapide • Qualité garantie
        </span>
      </div>
      
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 drop-shadow-2xl">
        Notre{' '}
        <span className="text-cyan-400 relative">
          Boutique
          <svg className="absolute -bottom-2 left-0 w-full h-2 md:h-3 text-cyan-400/50" viewBox="0 0 300 12" fill="none">
            <path d="M2 10C50 5 100 2 150 2C200 2 250 5 298 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      </h1>
      
      <p className="text-base md:text-lg text-gray-200 drop-shadow-lg px-4">
        Découvrez notre sélection de produits premium personnalisables. Qualité professionnelle garantie.
      </p>
    </div>
  </div>
</section>
```

---

## 🎯 QUICK FIX STEPS (IN ORDER)

1. **Download image from:** https://img.freepik.com/free-photo/shopping-cart-red-bags_23-2148288209.jpg
2. **Save to:** `Frontend/public/imgs/backgrounds/shopping-hero.jpg`
3. **Verify with PowerShell:** `Test-Path "Frontend\public\imgs\backgrounds\shopping-hero.jpg"`
4. **Stop dev server:** Ctrl+C
5. **Restart:** `cd Frontend && npm run dev`
6. **Test URL:** http://localhost:3000/imgs/backgrounds/shopping-hero.jpg
7. **Visit page:** http://localhost:3000/boutique

---

## 📞 PASTE YOUR RESULTS

Run this and paste the output:

```powershell
Write-Host "=== DIAGNOSTIC RESULTS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Image file exists:" -ForegroundColor Yellow
Test-Path "Frontend\public\imgs\backgrounds\shopping-hero.jpg"
Write-Host ""
Write-Host "2. File details:" -ForegroundColor Yellow
Get-Item "Frontend\public\imgs\backgrounds\shopping-hero.jpg" -ErrorAction SilentlyContinue | Format-List Name, Length, Extension, FullName
Write-Host ""
Write-Host "3. All files in backgrounds folder:" -ForegroundColor Yellow
Get-ChildItem "Frontend\public\imgs\backgrounds\" -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "4. Dev server status:" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName
```
