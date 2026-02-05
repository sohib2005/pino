'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Toolbar from '../editor/Toolbar';
import EditorCanvas from '../editor/EditorCanvas';
import TextControls from '../editor/TextControls';
import ImageControls from '../editor/ImageControls';
import ObjectControls from '../editor/ObjectControls';
import ShapesControls from '../editor/ShapesControls';
import PreviewPanel from '../editor/PreviewPanel';
import { ToolType } from '../editor/types';
import { isImageObject, isTextObject, createPrintAreaBoundary, PRINT_DPI } from '../editor/utils/canvasHelpers';
import { exportCanvas } from '../editor/utils/export';

export type TshirtView = 'AVANT' | 'DOS';

export interface PersonalizationExport {
  view: TshirtView;
  canvasJson: any;
  previewPngDataUrl: string;
  printPngDataUrl: string;
}

export interface PersonalizationEditorHandle {
  exportViews: () => Promise<{ front: PersonalizationExport | null; back: PersonalizationExport | null }>;
}

interface Props {
  initialView?: TshirtView;
  frontMockupUrl?: string;
  backMockupUrl?: string;
  title?: string;
  previewFooter?: React.ReactNode;
  canvasActions?: React.ReactNode;
  mobileSizeControl?: React.ReactNode;
}

const PRINT_AREA = { x: 150, y: 100, width: 500, height: 600 };

function filterDesignObjectsFromCanvasJson(json: any) {
  const objects = Array.isArray(json?.objects) ? json.objects : [];
  return {
    ...json,
    objects: objects.filter((o: any) => o?.name !== 'printAreaBoundary' && o?.name !== 'tshirtMockup'),
  };
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [meta, base64] = dataUrl.split(',');
  const mime = /data:(.*);base64/.exec(meta)?.[1] || 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new File([array], filename, { type: mime });
}

function PersonalizationEditorImpl(
  {
    initialView = 'AVANT',
    frontMockupUrl,
    backMockupUrl,
    title = 'Personnalisation T-shirt blanc',
    previewFooter,
    canvasActions,
    mobileSizeControl,
  }: Props,
  ref: React.Ref<PersonalizationEditorHandle>,
) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeView, setActiveView] = useState<TshirtView>(initialView);
  const activeViewRef = useRef<TshirtView>(initialView);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const savedDesignsRef = useRef<{ front?: any; back?: any }>({});

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    if (canvas) {
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
    }
  };

  const handleSelectionChange = (obj: fabric.Object | null) => {
    setSelectedObject(obj);
    if (obj) {
      if (isTextObject(obj)) setActiveTool('text');
      else if (isImageObject(obj)) setActiveTool('image');
      else setActiveTool('select');
    }
  };

  const renderRightPanel = () => {
    if (selectedObject) {
      if (isTextObject(selectedObject) && activeTool === 'text') {
        return <TextControls canvas={canvas} selectedObject={selectedObject} onUpdate={() => {}} embedded />;
      }
      if (isImageObject(selectedObject) && (activeTool === 'image' || activeTool === 'upload')) {
        return <ImageControls canvas={canvas} selectedObject={selectedObject} onUpdate={() => {}} embedded />;
      }
      return <ObjectControls canvas={canvas} selectedObject={selectedObject} onUpdate={() => {}} embedded />;
    }

    switch (activeTool) {
      case 'text':
        return <TextControls canvas={canvas} selectedObject={null} onUpdate={() => {}} embedded />;
      case 'image':
      case 'upload':
        return <ImageControls canvas={canvas} selectedObject={null} onUpdate={() => {}} embedded />;
      case 'shape':
        return <ShapesControls canvas={canvas} selectedObject={null} onUpdate={() => {}} embedded />;
      default:
        return <ObjectControls canvas={canvas} selectedObject={null} onUpdate={() => {}} embedded />;
    }
  };

  const handleCanvasChange = () => {
    saveCurrentDesign();
  };

  const saveCurrentDesign = () => {
    if (!canvas) return;
    const json = filterDesignObjectsFromCanvasJson(canvas.toJSON(['name']));
    if (activeViewRef.current === 'AVANT') savedDesignsRef.current.front = json;
    else savedDesignsRef.current.back = json;
  };

  const loadDesign = (view: TshirtView) => {
    if (!canvas) return Promise.resolve();

    // Remove existing design objects (keep boundary + mockup)
    const objectsToRemove = canvas
      .getObjects()
      .filter((o) => o.name !== 'printAreaBoundary' && o.name !== 'tshirtMockup');
    objectsToRemove.forEach((o) => canvas.remove(o));

    const json = view === 'AVANT' ? savedDesignsRef.current.front : savedDesignsRef.current.back;
    if (!json?.objects?.length) {
      canvas.renderAll();
      canvas.fire('object:modified');
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // fabric typings require a 3rd arg (namespace/reviver depending on version)
      fabric.util.enlivenObjects(
        json.objects,
        (enlivened: fabric.Object[]) => {
          enlivened.forEach((obj) => canvas.add(obj));

          // Ensure dashed print area stays visible
          const boundary = canvas.getObjects().find((o) => o.name === 'printAreaBoundary');
          if (boundary) canvas.bringToFront(boundary);

          canvas.renderAll();
          canvas.fire('object:modified');
          resolve();
        },
        undefined as any,
      );
    });
  };

  const switchView = async (view: TshirtView) => {
    if (!canvas) {
      setActiveView(view);
      activeViewRef.current = view;
      return;
    }

    saveCurrentDesign();
    setSelectedObject(null);
    canvas.discardActiveObject();
    setActiveView(view);
    activeViewRef.current = view;

    // next tick to ensure EditorCanvas receives new mockupUrl
    await new Promise((r) => setTimeout(r, 0));
    await loadDesign(view);

    // allow mockup image to load/render (raster load is async)
    await new Promise((r) => setTimeout(r, 120));
  };

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const exportView = async (view: TshirtView): Promise<PersonalizationExport | null> => {
    if (!canvas) return null;

    const prevView = activeView;
    // ensure latest edits captured
    saveCurrentDesign();

    await switchView(view);

    const expectedMockupUrl = view === 'AVANT' ? frontMockupUrl : backMockupUrl;
    if (expectedMockupUrl) {
      const start = Date.now();
      const timeout = 1200;

      while (Date.now() - start < timeout) {
        const mockup = canvas.getObjects().find((o) => o.name === 'tshirtMockup') as any;
        if (mockup?.mockupUrl === expectedMockupUrl) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    const boundary = canvas.getObjects().find((o) => o.name === 'printAreaBoundary');
    const mockup = canvas.getObjects().find((o) => o.name === 'tshirtMockup');

    const originalBg = canvas.backgroundColor;
    const boundaryVisible = boundary?.visible;
    const mockupVisible = mockup?.visible;

    // Build JSON (design-only)
    const json = filterDesignObjectsFromCanvasJson(canvas.toJSON(['name']));

    // Preview export (clean canvas screenshot, keep mockup)
    if (boundary) boundary.set('visible', false);
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    const previewPngDataUrl = exportCanvas(canvas, {
      format: 'png',
      quality: 1,
      dpi: PRINT_DPI,
      transparentBackground: false,
    });

    // Print export (design-only, cropped to print area)
    if (mockup) mockup.set('visible', false);
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    const multiplier = PRINT_DPI / 96;
    const printPngDataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
      enableRetinaScaling: true,
      left: PRINT_AREA.x,
      top: PRINT_AREA.y,
      width: PRINT_AREA.width,
      height: PRINT_AREA.height,
    });

    // Restore visibility/bg
    if (typeof boundaryVisible === 'boolean' && boundary) boundary.set('visible', boundaryVisible);
    if (typeof mockupVisible === 'boolean' && mockup) mockup.set('visible', mockupVisible);
    canvas.backgroundColor = originalBg;
    canvas.renderAll();

    // Restore previous view
    await switchView(prevView);

    if (!previewPngDataUrl || !printPngDataUrl) return null;
    return { view, canvasJson: json, previewPngDataUrl, printPngDataUrl };
  };

  useImperativeHandle(
    ref,
    () => ({
      exportViews: async () => ({
        front: await exportView('AVANT'),
        back: await exportView('DOS'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvas, activeView],
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
      <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />

      <div className="flex-1 min-h-0 h-full flex flex-col order-2 sm:order-none relative">
        <EditorCanvas
          canvas={canvas}
          setCanvas={(c) => {
            setCanvas(c);
            // Make sure the boundary is visible and correctly named even if fabric changes
            const existingBoundary = c.getObjects().find((o) => o.name === 'printAreaBoundary');
            if (!existingBoundary) {
              const boundary = createPrintAreaBoundary(PRINT_AREA);
              c.add(boundary);
              c.bringToFront(boundary);
              c.renderAll();
            }
          }}
          onSelectionChange={handleSelectionChange}
          onCanvasChange={handleCanvasChange}
          mockupUrl={activeView === 'AVANT' ? frontMockupUrl : backMockupUrl}
          rightActions={canvasActions}
          mobileActions={
            canvasActions ? (
              <button
                onClick={(canvasActions as any).props?.onClick}
                disabled={(canvasActions as any).props?.disabled}
                className="w-12 h-12 rounded-full bg-pino-blue text-white shadow flex items-center justify-center"
                title="Ajouter au panier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6h12.4M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </button>
            ) : null
          }
          side={activeView === 'AVANT' ? 'front' : 'back'}
          onSideChange={(side) => switchView(side === 'front' ? 'AVANT' : 'DOS')}
        />

        {/* Mobile size selector */}
        {mobileSizeControl && (
          <div className="sm:hidden fixed bottom-24 left-4 z-40">
            <div className="bg-white rounded-full shadow px-4 py-2">
              {mobileSizeControl}
            </div>
          </div>
        )}

        {/* Mobile options button */}
        <div className="sm:hidden fixed bottom-16 left-0 right-0 px-4 z-40">
          <button
            onClick={() => setIsOptionsOpen((v) => !v)}
            className="w-full py-3 bg-pino-blue text-white rounded-lg font-semibold shadow"
          >
            {isOptionsOpen ? 'Masquer les options' : 'Afficher les options'}
          </button>
        </div>
      </div>

      <aside className={`w-full sm:w-80 min-h-0 h-full bg-white border-l sm:border-l border-t sm:border-t-0 border-gray-200 overflow-y-auto order-3 sm:order-none ${isOptionsOpen ? 'block' : 'hidden sm:block'}`}>
        {renderRightPanel()}
      </aside>
      <PreviewPanel
        canvas={canvas}
        footer={previewFooter}
        refreshKey={activeView}
        className={`w-full sm:w-64 border-t sm:border-t-0 ${isOptionsOpen ? 'block' : 'hidden sm:block'}`}
      />
    </div>
  );
}

const PersonalizationEditor = forwardRef(PersonalizationEditorImpl);
export default PersonalizationEditor;

export { dataUrlToFile };
