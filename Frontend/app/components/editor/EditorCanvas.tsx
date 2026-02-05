/**
 * EditorCanvas Component
 * Main canvas area with T-shirt mockup and fabric.js canvas
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, RotateCw } from 'lucide-react';
import {
  createPrintAreaBoundary,
  constrainToPrintArea,
  snapToCenter,
} from './utils/canvasHelpers';
import { PrintArea } from './types';

interface EditorCanvasProps {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  onSelectionChange: (obj: fabric.Object | null) => void;
  onCanvasChange: () => void;
  mockupUrl?: string;
  rightActions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  enableSideToggle?: boolean;
  side?: 'front' | 'back';
  onSideChange?: (side: 'front' | 'back') => void;
}

export default function EditorCanvas({ 
  canvas, 
  setCanvas, 
  onSelectionChange, 
  onCanvasChange,
  mockupUrl = '/imgs/tshirt-mockup.svg',
  rightActions,
  mobileActions,
  enableSideToggle = true,
  side,
  onSideChange,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const historyRef = useRef<string[]>([]);
  const centerScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    if (maxScrollLeft > 0) {
      el.scrollLeft = maxScrollLeft / 2;
    }
    if (maxScrollTop > 0) {
      el.scrollTop = maxScrollTop / 2;
    }
  };

  useEffect(() => {
    if (!canvas) return;
    const handleResize = () => centerScroll();
    const t1 = setTimeout(centerScroll, 0);
    const t2 = setTimeout(centerScroll, 200);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas]);

  const historyStepRef = useRef(0);
  const lastMockupUrlRef = useRef<string | null>(null);
  const savedDesignsRef = useRef<{ front?: any; back?: any }>({});
  const clipboardRef = useRef<fabric.Object | null>(null);
  const isControlledSide = typeof onSideChange === 'function';
  const currentSide = side ?? activeSide;

  // Print area dimensions (in pixels at 300 DPI)
  const PRINT_AREA: PrintArea = {
    x: 270,
    y: 180,
    width: 265,
    height: 460,
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 800,
      backgroundColor: '#f3f4f6',
      preserveObjectStacking: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    // Add print area boundary
    const boundary = createPrintAreaBoundary(PRINT_AREA);
    fabricCanvas.add(boundary);
    
    // Initial render to ensure canvas is ready
    fabricCanvas.renderAll();

    setCanvas(fabricCanvas);
    saveHistory(fabricCanvas);

    // Event handlers
    fabricCanvas.on('selection:created', (e: any) => {
      onSelectionChange(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:updated', (e: any) => {
      onSelectionChange(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectionChange(null);
    });

    fabricCanvas.on('object:modified', () => {
      saveHistory(fabricCanvas);
      onCanvasChange();
    });

    fabricCanvas.on('object:added', () => {
      onCanvasChange();
    });

    fabricCanvas.on('object:removed', () => {
      onCanvasChange();
    });

    fabricCanvas.on('mouse:down', (opt: any) => {
      const ev = opt.e as MouseEvent;
      if (ev.button === 2) {
        ev.preventDefault();
        const target = opt.target as fabric.Object | undefined;
        if (target) {
          fabricCanvas.setActiveObject(target);
        } else {
          fabricCanvas.discardActiveObject();
        }
        fabricCanvas.renderAll();

        setContextMenu({
          x: ev.clientX,
          y: ev.clientY,
          visible: true,
        });
      } else {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    });

    // Constrain objects to print area
    fabricCanvas.on('object:moving', (e: any) => {
      if (e.target && e.target.name !== 'printAreaBoundary' && e.target.name !== 'tshirtMockup') {
        constrainToPrintArea(e.target, PRINT_AREA);
        snapToCenter(e.target, fabricCanvas, 15);
      }
    });

    fabricCanvas.on('object:scaling', (e: any) => {
      if (e.target && e.target.name !== 'printAreaBoundary' && e.target.name !== 'tshirtMockup') {
        constrainToPrintArea(e.target, PRINT_AREA);
      }
    });

    // Load initial mockup
    lastMockupUrlRef.current = null;

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvas.getActiveObject()) {
        const activeObject = fabricCanvas.getActiveObject();
        const isEditingText =
          activeObject &&
          (activeObject.type === 'i-text' || activeObject.type === 'textbox' || activeObject.type === 'text') &&
          (activeObject as any).isEditing;

        if (isEditingText) return;

        e.preventDefault();
        if (activeObject) {
          fabricCanvas.remove(activeObject);
          fabricCanvas.renderAll();
          onCanvasChange();
        }
      }
      
      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    const handleDocumentClick = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleDocumentClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocumentClick);
      fabricCanvas.dispose();
    };
  }, []);

  const handleSave = () => {
    // Prevent runtime error from Ctrl+S and provide a useful default export
    if (!canvas) return;
    try {
      const json = canvas.toJSON(['name', 'mockupUrl']);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${currentSide}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[EditorCanvas] Save failed', err);
    }
  };

  const isSameOriginUrl = (url: string) => {
    try {
      // relative URLs are same-origin
      if (url.startsWith('/')) return true;
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  const fetchSvgText = async (url: string) => {
    // If your "templates" are SVGs served by an API with cookies, this makes failures explicit (status/body)
    const res = await fetch(url, {
      method: 'GET',
      // only include cookies for same-origin to avoid CORS credential pitfalls
      credentials: isSameOriginUrl(url) ? 'include' : 'omit',
      mode: 'cors',
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`SVG fetch failed (${res.status}) ${url}\n${body.slice(0, 500)}`);
    }
    return await res.text();
  };

  const loadMockup = (targetCanvas: fabric.Canvas, url: string) => {
    // Remove existing mockup
    const existing = targetCanvas.getObjects().find((o) => o.name === 'tshirtMockup');
    if (existing) targetCanvas.remove(existing);

    const finishAdd = (obj: fabric.Object) => {
      obj.set({
        left: targetCanvas.width! / 2,
        top: targetCanvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        name: 'tshirtMockup',
        mockupUrl: url,
      });

      // Fit nicely inside the canvas
      const maxW = (targetCanvas.width || 800) * 0.75;
      const maxH = (targetCanvas.height || 800) * 0.75;
      const objW = (obj as any).width || 1;
      const objH = (obj as any).height || 1;
      const scale = Math.min(maxW / objW, maxH / objH);
      if (Number.isFinite(scale) && scale > 0) obj.scale(scale);

      targetCanvas.add(obj);
      targetCanvas.sendToBack(obj);

      const boundary = targetCanvas.getObjects().find((o) => o.name === 'printAreaBoundary');
      if (boundary) targetCanvas.bringToFront(boundary);

      targetCanvas.renderAll();
    };

    // SVG vs raster
    if (url.toLowerCase().endsWith('.svg')) {
      (async () => {
        try {
          const svgText = await fetchSvgText(url);
          fabric.loadSVGFromString(svgText, (objects: any[], options: any) => {
            if (!objects || objects.length === 0) return;
            try {
              const svg = fabric.util.groupSVGElements(objects, options);
              finishAdd(svg);
            } catch (error) {
              console.error('[EditorCanvas] SVG parsed but could not be grouped', { url, error });
            }
          });
        } catch (error) {
          // This is the key: you’ll now see the real URL + HTTP status instead of a generic “failed to fetch”
          console.error('[EditorCanvas] Failed to load SVG mockup/template', { url, error });
        }
      })();
      return;
    }

    // Raster with explicit onerror (fabric.Image.fromURL does not always surface the network error)
    try {
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => finishAdd(new fabric.Image(imgEl));
      imgEl.onerror = (e) => {
        console.error('[EditorCanvas] Failed to load raster mockup/template', { url, event: e });
      };
      imgEl.src = url;
    } catch (error) {
      console.error('[EditorCanvas] Failed to init raster loader', { url, error });
    }
  };

  const activeMockupUrl = enableSideToggle
    ? currentSide === 'front'
      ? mockupUrl
      : '/imgs/tshirt-blanc-dos.png'
    : mockupUrl;

  const saveCurrentDesign = () => {
    if (!canvas) return;
    const json = canvas.toJSON(['name']);
    const objects = Array.isArray(json.objects) ? json.objects : [];
    const designOnly = {
      ...json,
      objects: objects.filter((o: any) => o?.name !== 'printAreaBoundary' && o?.name !== 'tshirtMockup'),
    };
    if (currentSide === 'front') savedDesignsRef.current.front = designOnly;
    else savedDesignsRef.current.back = designOnly;
  };

  const loadDesign = (side: 'front' | 'back') => {
    if (!canvas) return;
    const objectsToRemove = canvas
      .getObjects()
      .filter((o) => o.name !== 'printAreaBoundary' && o.name !== 'tshirtMockup');
    objectsToRemove.forEach((o) => canvas.remove(o));

    const json = side === 'front' ? savedDesignsRef.current.front : savedDesignsRef.current.back;
    if (!json?.objects?.length) {
      canvas.renderAll();
      return;
    }

    fabric.util.enlivenObjects(
      json.objects,
      (enlivened: fabric.Object[]) => {
        enlivened.forEach((obj) => canvas.add(obj));
        const boundary = canvas.getObjects().find((o) => o.name === 'printAreaBoundary');
        if (boundary) canvas.bringToFront(boundary);
        canvas.renderAll();
      },
      undefined as any,
    );
  };

  const switchSide = (nextSide: 'front' | 'back') => {
    if (nextSide === currentSide) return;
    if (isControlledSide) {
      onSideChange?.(nextSide);
      return;
    }
    saveCurrentDesign();
    setActiveSide(nextSide);
    loadDesign(nextSide);
  };

  // Reload mockup when the URL changes (supports switching AVANT/DOS)
  useEffect(() => {
    if (!canvas) return;
    if (!activeMockupUrl) return;
    if (lastMockupUrlRef.current === activeMockupUrl) return;
    lastMockupUrlRef.current = activeMockupUrl;
    loadMockup(canvas, activeMockupUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, activeMockupUrl]);

  // History management
  const saveHistory = (canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current++;
    setCanUndo(historyStepRef.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (!canvas || historyStepRef.current <= 0) return;
    
    historyStepRef.current--;
    const state = historyRef.current[historyStepRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setCanUndo(historyStepRef.current > 0);
      setCanRedo(true);
      onCanvasChange();
    });
  };

  const redo = () => {
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;
    
    historyStepRef.current++;
    const state = historyRef.current[historyStepRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setCanUndo(true);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
      onCanvasChange();
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!canvas) return;
    setIsAutoFit(false);
    const newZoom = Math.min(zoom + 0.1, 3);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    setIsAutoFit(false);
    const newZoom = Math.max(zoom - 0.1, 0.5);
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    if (!canvas) return;
    setIsAutoFit(true);
  };

  const handleCopy = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((cloned: fabric.Object) => {
      clipboardRef.current = cloned;
    });
  };

  const handleCut = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    handleCopy();
    canvas.remove(activeObject);
    canvas.renderAll();
    onCanvasChange();
  };

  const handleDuplicate = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      onCanvasChange();
    });
  };

  const handlePaste = () => {
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      onCanvasChange();
    });
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    canvas.remove(activeObject);
    canvas.renderAll();
    onCanvasChange();
  };

  const fitToContainer = () => {
    if (!canvas) return;
    const areaEl = scrollRef.current ?? containerRef.current;
    if (!areaEl) return;
    const containerWidth = areaEl.clientWidth;
    const containerHeight = areaEl.clientHeight;

    const paddingX = 32;
    const paddingY = 32;
    const availableWidth = Math.max(0, containerWidth - paddingX);
    const availableHeight = Math.max(0, containerHeight - paddingY);

    const baseWidth = canvas.getWidth();
    const baseHeight = canvas.getHeight();

    if (baseWidth === 0 || baseHeight === 0) return;
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const scale = Math.max(0.35, Math.min(availableWidth / baseWidth, availableHeight / baseHeight, 1));
    canvas.setZoom(scale);
    setZoom(scale);
    centerScroll();
  };

  useEffect(() => {
    if (!canvas || !containerRef.current || !isAutoFit) return;

    fitToContainer();

    const observer = new ResizeObserver(() => {
      if (isAutoFit) fitToContainer();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, isAutoFit]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 h-full flex flex-col bg-gray-100 relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Toolbar (desktop) */}
      <div data-editor-toolbar className="hidden sm:flex bg-white border-b border-gray-200 px-4 py-2.5 items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            title="Annuler (Ctrl+Z)"
          >
            <RotateCcw className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            title="Rétablir (Ctrl+Y)"
          >
            <RotateCw className="w-5 h-5 text-gray-700" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            title="Zoom arrière"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            title="Zoom avant"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            title="Réinitialiser le zoom"
          >
            <Maximize2 className="w-5 h-5 text-gray-700" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Front/Back */}
          {enableSideToggle && (
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => switchSide('front')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  currentSide === 'front'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Avant
              </button>
              <button
                onClick={() => switchSide('back')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  currentSide === 'back'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Arrière
              </button>
            </div>
          )}

        </div>

        <div className="flex items-center gap-2">
          {rightActions}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[60vh] sm:min-h-0 h-full flex items-start sm:items-center justify-center pb-4 px-4 sm:px-0 overflow-hidden"
      >
        <div className="relative w-full flex justify-center">
          {/* Canvas */}
          <div className="bg-transparent p-2 mx-auto sm:min-w-[px] sm:min-h-[800px]">
            <canvas ref={canvasRef} />
          </div>

          {/* Helper hints */}
          <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-6 text-xs text-gray-500">
            <span>• Double-cliquez pour éditer</span>
            <span>• Glissez les coins pour redimensionner</span>
            <span>• Accrochage au centre</span>
          </div>
        </div>
      </div>

      {/* Mobile side toggle */}
      {enableSideToggle && (
        <div className="sm:hidden fixed top-24 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center bg-white rounded-full p-1 shadow">
            <button
              onClick={() => switchSide('front')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                currentSide === 'front'
                  ? 'bg-pino-blue text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Avant
            </button>
            <button
              onClick={() => switchSide('back')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                currentSide === 'back'
                  ? 'bg-pino-blue text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Arrière
            </button>
          </div>
        </div>
      )}

      {/* Mobile primary action (e.g., add to cart) */}
      {mobileActions && (
        <div className="sm:hidden fixed bottom-24 right-4 z-40">
          {mobileActions}
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-48 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100" onClick={handleCopy}>Copier</button>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100" onClick={handleCut}>Couper</button>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100" onClick={handleDuplicate}>Dupliquer</button>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100" onClick={handlePaste}>Coller</button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600" onClick={handleDelete}>Supprimer</button>
        </div>
      )}
    </div>
  );
}
