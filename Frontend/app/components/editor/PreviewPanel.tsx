/**
 * PreviewPanel Component
 * Live preview of the current design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Eye } from 'lucide-react';

interface PreviewPanelProps {
  canvas: fabric.Canvas | null;
  embedded?: boolean;
  footer?: React.ReactNode;
  refreshKey?: string | number;
  className?: string;
}

export default function PreviewPanel({ canvas, embedded = false, footer, refreshKey, className }: PreviewPanelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewCanvas, setPreviewCanvas] = useState<fabric.StaticCanvas | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize preview canvas
  useEffect(() => {
    if (!previewCanvasRef.current) return;

    const preview = new fabric.StaticCanvas(previewCanvasRef.current, {
      width: 200,
      height: 200,
      backgroundColor: '#f5f5f5',
    });

    setPreviewCanvas(preview);

    return () => {
      preview.dispose();
    };
  }, []);

  // Update preview when main canvas changes
  useEffect(() => {
    if (!canvas || !previewCanvas) return;

    const updatePreview = () => {
      setIsUpdating(true);

      // Clone canvas state
      const json = canvas.toJSON();
      
      previewCanvas.loadFromJSON(json, () => {
        // Scale down to fit preview
        const scale = 200 / Math.max(canvas.width!, canvas.height!);
        previewCanvas.setZoom(scale);
        previewCanvas.renderAll();
        setIsUpdating(false);
      });
    };

    // Initial update + retries (for async load on side switch)
    updatePreview();
    const retry1 = setTimeout(updatePreview, 80);
    const retry2 = setTimeout(updatePreview, 200);
    const retry3 = setTimeout(updatePreview, 350);

    // Listen to canvas events
    const events = ['object:modified', 'object:added', 'object:removed'];
    events.forEach(event => {
      canvas.on(event, updatePreview);
    });

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
      clearTimeout(retry3);
      events.forEach(event => {
        canvas.off(event, updatePreview);
      });
    };
  }, [canvas, previewCanvas, refreshKey]);

  const containerClass = embedded
    ? 'p-4 h-full'
    : 'w-64 bg-white border-l border-gray-200 p-6 overflow-y-auto shadow-sm';

  return (
    <div className={`${containerClass}${className ? ` ${className}` : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-pino-blue" />
        <h2 className="text-sm font-semibold text-gray-900">Aperçu</h2>
      </div>

      {/* Preview Canvas */}
      <div className="bg-gray-100 rounded-xl p-3 mb-4 relative">
        <canvas ref={previewCanvasRef} className="w-full h-auto" />
        {isUpdating && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
            <div className="w-6 h-6 border-2 border-pino-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {footer && <div>{footer}</div>}

      
    </div>
  );
}
