# 🧪 Image Upload System - Manual Testing Guide

## ✅ Current Status

### Backend Files CONFIRMED
The system IS saving files correctly to disk:
```
Backend/uploads/products/
  ├── product-1769550088120-579958154.png (103 KB) - Uploaded 1:41 PM
  └── product-1769550761320-27548006.png (103 KB) - Uploaded 1:52 PM
```

## 🔍 Critical Tests You MUST Do Now

### Test 1: Check if Images Are Accessible via Browser

**Open these URLs in your browser:**

1. http://localhost:3001/uploads/products/product-1769550088120-579958154.png
2. http://localhost:3001/uploads/products/product-1769550761320-27548006.png

**Expected Result:** ✅ Image should load (showing your blanc1.png or blanc2.png)

**If you get 404:** ❌ Static file serving is broken

**If image loads:** ✅ Backend is working perfectly!

---

### Test 2: Check Upload with Network Tab

1. **Open your admin products page:** http://localhost:3000/admin/products
2. **Press F12** to open DevTools
3. **Go to Network tab**
4. **Click "Ajouter Produit" button**
5. **Click the "Fichier" button**
6. **Select an image** (blanc1.png, blanc2.png, or blanc3.png)

**In Network Tab, look for:**
- Request URL: `http://localhost:3001/products/upload-image`
- Method: `POST`
- Status: `201` (or `200`)
- Content-Type (request): `multipart/form-data; boundary=...`

**Click on the request → Payload tab:**
- Should show: `file: (binary)` with your filename

**Click on Response tab:**
```json
{
  "imageUrl": "http://localhost:3001/uploads/products/product-XXXXX.png",
  "imagePath": "/uploads/products/product-XXXXX.png"
}
```

---

### Test 3: Check Console Logs

**Open Console tab in DevTools**

When you select an image, you should see:
```
📁 File selected: blanc1.png Size: 103201 Type: image/png
🖼️ Created local preview: blob:http://localhost:3000/...
📤 Sending to backend...
📥 Response status: 201
✅ Upload response: { imageUrl: "...", imagePath: "..." }
🔗 Image URL: http://localhost:3001/uploads/products/product-XXXXX.png
✅ Image URL updated in state: http://localhost:3001/uploads/products/...
```

**If you see this:** ❌ `Image failed to load: http://localhost:3001/...`
- The upload worked, but the image can't be displayed
- Test the URL directly in browser (Test 1)

---

## 🆕 What Changed (Fixes Applied)

### Frontend Changes:

1. **✅ Instant Preview with Blob URL**
   - Creates `URL.createObjectURL(file)` immediately
   - You see your image BEFORE upload completes
   - Even if backend is slow, preview appears instantly

2. **✅ Better Error Handling**
   - `onError` now logs to console instead of hiding image
   - You can see exactly which URL failed to load

3. **✅ Detailed Console Logging**
   - Every step logged with emojis 📁📤📥✅
   - Easy to debug where it fails

### Backend Changes:

1. **✅ Returns Both Paths**
   ```json
   {
     "imageUrl": "http://localhost:3001/uploads/products/file.png",
     "imagePath": "/uploads/products/file.png"
   }
   ```
   - `imageUrl`: Full URL for development
   - `imagePath`: Relative path for production

2. **✅ More Reliable Static Serving**
   - Changed from `join(__dirname, '..', 'uploads')`
   - To: `join(process.cwd(), 'uploads')`
   - Works better with compiled Nest code

3. **✅ Backend Logging**
   - Logs file upload success
   - Logs static files location on startup

---

## 🐛 Common Issues & Solutions

### Issue 1: Image Doesn't Appear After Upload

**Symptom:** File uploads, console shows success, but preview stays empty

**Diagnosis:**
1. Check Console for: `❌ Image failed to load: http://...`
2. Copy that URL
3. Paste it in browser
4. If it 404s → static serving issue
5. If it loads → frontend rendering issue

**Fix:**
- Check backend logs for: `📁 Static files served from: C:\Users\Sohib\stage-pino\Backend\uploads`
- Verify backend is running on port 3001
- Check CORS is enabled

---

### Issue 2: Port 3001 Already in Use

**Symptom:** Backend won't start - `EADDRINUSE: address already in use :::3001`

**Fix:**
```powershell
# Find process using port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Kill it
Stop-Process -Id XXXX -Force

# Or use different port in .env
# PORT=3002
```

---

### Issue 3: Upload Returns 413 (Payload Too Large)

**Cause:** File > 5MB

**Fix:** Increase limit in `product.controller.ts`:
```typescript
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
}
```

---

### Issue 4: Upload Returns 400 (Bad Request)

**Cause:** File type not allowed (only jpg, jpeg, png, gif, webp accepted)

**Check:** Console shows file type: `Type: image/png`

---

## 📝 Testing Checklist

- [ ] Backend is running on port 3001
- [ ] Test URL 1 loads in browser (see Test 1 above)
- [ ] Test URL 2 loads in browser (see Test 1 above)
- [ ] Network tab shows POST request to `/products/upload-image`
- [ ] Network tab shows status 200 or 201
- [ ] Network tab Payload shows `file: (binary)`
- [ ] Network tab Response shows `{ imageUrl, imagePath }`
- [ ] Console shows all emoji logs (📁📤📥✅)
- [ ] Local preview appears IMMEDIATELY (blob URL)
- [ ] After upload, preview updates to server URL
- [ ] No console errors about "Image failed to load"

---

## 🎯 Next Steps

1. **DO THE TESTS ABOVE** ⬆️
2. **Copy the results** (screenshots or text)
3. **Share:**
   - What you see in Network tab
   - What you see in Console tab
   - Whether the test URLs (Test 1) work

Then I can pinpoint the exact issue!

---

## 🛠️ Quick Test with HTML File

I created a standalone test file:

**Location:** `Backend/test-upload.html`

**How to use:**
1. Double-click `test-upload.html` to open in browser
2. Click "Choose File"
3. Select an image
4. Click "Upload Image"
5. See detailed results and preview

This tests the upload WITHOUT your Next.js app (isolates the issue).
