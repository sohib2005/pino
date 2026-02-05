# 🎨 Professional T-Shirt Design Editor

A production-ready, professional-grade t-shirt design editor built for the Pino platform. This editor provides a complete POD (Print-on-Demand) experience comparable to industry leaders like Printify and Placeit.

## 🚀 Features

### Core Functionality
- ✅ **Professional Canvas Editor** - Fabric.js-powered high-performance canvas
- ✅ **T-Shirt Mockup** - Realistic t-shirt visualization with print area boundaries
- ✅ **Text Editor** - Advanced typography controls with 12+ fonts
- ✅ **Image Upload** - Support for PNG, JPG, SVG with drag-and-drop
- ✅ **Shapes Library** - Rectangles, circles, triangles, stars, and hearts
- ✅ **Object Controls** - Comprehensive manipulation (drag, resize, rotate, flip, layer)
- ✅ **Live Preview** - Real-time design preview with product details
- ✅ **Undo/Redo** - Full history management
- ✅ **Export** - High-resolution PNG export at 300 DPI
- ✅ **Auto-Save** - Local storage persistence

### Design System Integration
- ✅ Matches existing Pino brand colors (`--pino-blue`)
- ✅ Uses Tailwind CSS utility classes
- ✅ Consistent typography and spacing
- ✅ Smooth animations and transitions
- ✅ Responsive hover states

## 📂 File Structure

```
app/
├── editor/
│   └── page.tsx                    # Editor route
└── components/
    └── editor/
        ├── EditorLayout.tsx        # Main orchestrator
        ├── EditorCanvas.tsx        # Canvas area with mockup
        ├── Toolbar.tsx             # Left sidebar tools
        ├── TextControls.tsx        # Text editing panel
        ├── ImageControls.tsx       # Image upload panel
        ├── ShapesControls.tsx      # Shapes panel
        ├── ObjectControls.tsx      # Universal object controls
        ├── PreviewPanel.tsx        # Live preview
        ├── types.ts                # TypeScript definitions
        └── utils/
            ├── canvasHelpers.ts    # Canvas utilities
            ├── sizing.ts           # Size calculations
            └── export.ts           # Export functions
```

## 🎯 Key Components

### 1. **EditorLayout**
Main container that orchestrates all editor components. Manages state and tool switching.

### 2. **EditorCanvas**
The core canvas area featuring:
- Fabric.js canvas initialization
- T-shirt mockup rendering
- Print area boundaries
- Zoom controls
- Undo/Redo functionality
- Auto-save
- Export functionality

### 3. **Toolbar**
Vertical icon-based navigation:
- Select tool
- Text tool
- Images tool
- Shapes tool
- Upload tool
- Design library

### 4. **TextControls**
Professional text editor with:
- Font family selection (12 fonts)
- Font size slider (10-200px)
- Color picker
- Bold, Italic, Underline
- Text alignment
- Letter spacing
- Line height

### 5. **ImageControls**
Image management:
- File upload (PNG, JPG, SVG)
- Sample stock images
- Drag and resize
- Delete functionality

### 6. **ShapesControls**
Shape creation:
- Rectangle, Circle, Triangle
- Star, Heart
- Fill color customization
- Stroke width and color

### 7. **ObjectControls**
Universal object manipulation:
- Real-size display (in cm)
- Opacity control
- Rotation control
- Flip horizontal/vertical
- Layer ordering (bring forward, send backward)
- Lock/unlock
- Duplicate
- Delete

### 8. **PreviewPanel**
Live design preview:
- Real-time canvas mirroring
- Product information
- Size availability
- Print quality specs
- Pro tips

## 🛠️ Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Canvas**: Fabric.js 5.x
- **Icons**: Lucide React
- **State**: React Hooks

## 🎨 Design Principles

1. **Matches Existing Theme** - Uses Pino brand colors and design language
2. **Production Quality** - Clean, professional, investor-ready
3. **User-Friendly** - Intuitive controls with helpful tooltips
4. **Performance** - Optimized rendering and state management
5. **Accessibility** - Keyboard shortcuts and focus states

## 🖥️ Usage

### Access the Editor
Navigate to `/editor` in your application.

### Workflow
1. Select a tool from the left sidebar
2. Add text, images, or shapes to the canvas
3. Use the right panel to customize properties
4. Objects auto-constrain to the print area
5. Preview your design in real-time
6. Export as high-resolution PNG

### Keyboard Shortcuts
- `Ctrl + Z` - Undo
- `Ctrl + Y` - Redo
- `Delete` - Remove selected object
- `Ctrl + D` - Duplicate (coming soon)
- `Ctrl + S` - Save

## 📐 Print Specifications

- **Print Area**: 500×600px (at 300 DPI)
- **Real Size**: ~17.28cm × 19.08cm
- **Resolution**: 300 DPI (print-ready)
- **Export Format**: PNG with transparency support

## 🎯 Features Roadmap

### Phase 1 (✅ Complete)
- ✅ Basic text editor
- ✅ Image upload
- ✅ Shapes
- ✅ Object controls
- ✅ Export

### Phase 2 (Future)
- [ ] Design templates library
- [ ] Custom fonts upload
- [ ] Clipart library
- [ ] Background remover
- [ ] Color picker from image
- [ ] Text on path/curve
- [ ] Multiple mockup views (front/back)
- [ ] Product variants (hoodie, tank top)

### Phase 3 (Future)
- [ ] Collaboration features
- [ ] Cloud save
- [ ] Design marketplace
- [ ] AI-powered design suggestions
- [ ] Bulk export

## 💡 Pro Tips

1. **Design Area**: Keep all elements within the dashed boundary
2. **Resolution**: Upload high-res images (300 DPI recommended)
3. **Colors**: Use vibrant colors for best print results
4. **Contrast**: Ensure good contrast with t-shirt color
5. **Save Often**: Use the save button to persist your work

## 🔥 What Makes This Special

1. **Commercial Quality** - Built like a SaaS product
2. **Design System Harmony** - Seamlessly integrates with existing UI
3. **Extensible** - Easy to add new tools and features
4. **Type-Safe** - Full TypeScript coverage
5. **Performance** - Optimized for smooth 60fps interactions
6. **User Experience** - Tooltips, hints, and helpful feedback

## 🚀 Getting Started

The editor is ready to use! Simply:

1. Navigate to `/editor`
2. Start designing
3. Export when ready

## 🎨 Customization

### Adding New Fonts
Edit `types.ts` and add to the `FONT_FAMILIES` array.

### Changing Print Area
Modify `PRINT_AREA` constants in `EditorCanvas.tsx`.

### Adding New Tools
1. Add tool type to `types.ts`
2. Create tool component (follow existing patterns)
3. Add to `EditorLayout.tsx` rendering logic
4. Add icon to `Toolbar.tsx`

## 📝 License

Part of the Pino platform. All rights reserved.

---

**Built with ❤️ for the Pino platform**
