/**
 * EditorLayout Component
 * Main layout orchestrating all editor components
 */

'use client';

import { useState } from 'react';
import { fabric } from 'fabric';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import TextControls from './TextControls';
import ImageControls from './ImageControls';
import ObjectControls from './ObjectControls';
import ShapesControls from './ShapesControls';
import PreviewPanel from './PreviewPanel';
import QuickStartGuide from './QuickStartGuide';
import { ToolType } from './types';
import { isTextObject, isImageObject } from './utils/canvasHelpers';

export default function EditorLayout() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [canvasUpdateTrigger, setCanvasUpdateTrigger] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    
    // Clear selection when switching tools
    if (canvas) {
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObject(null);
    }
  };

  const handleSelectionChange = (obj: fabric.Object | null) => {
    setSelectedObject(obj);
    
    // Auto-switch to appropriate tool based on selection
    if (obj) {
      if (isTextObject(obj)) {
        setActiveTool('text');
      } else if (isImageObject(obj)) {
        setActiveTool('image');
      } else {
        setActiveTool('select');
      }
    }
  };

  const handleCanvasChange = () => {
    setCanvasUpdateTrigger(prev => prev + 1);
  };

  const handleUpdate = () => {
    handleCanvasChange();
  };

  // Render right panel based on active tool
  const renderRightPanel = () => {
    // If object is selected, show object controls
    if (selectedObject) {
      // But if it's text and text tool is active, show text controls
      if (isTextObject(selectedObject) && activeTool === 'text') {
        return (
          <TextControls
            canvas={canvas}
            selectedObject={selectedObject}
            onUpdate={handleUpdate}
            embedded
          />
        );
      }
      
      // If it's image and image tool is active, show image controls
      if (isImageObject(selectedObject) && activeTool === 'image') {
        return (
          <ImageControls
            canvas={canvas}
            selectedObject={selectedObject}
            onUpdate={handleUpdate}
            embedded
          />
        );
      }
      
      // Otherwise show generic object controls
      return (
        <ObjectControls
          canvas={canvas}
          selectedObject={selectedObject}
          onUpdate={handleUpdate}
          embedded
        />
      );
    }

    // No selection - show tool-specific panel
    switch (activeTool) {
      case 'text':
        return (
          <TextControls
            canvas={canvas}
            selectedObject={null}
            onUpdate={handleUpdate}
            embedded
          />
        );
      
      case 'image':
      case 'upload':
        return (
          <ImageControls
            canvas={canvas}
            selectedObject={null}
            onUpdate={handleUpdate}
            embedded
          />
        );
      
      case 'shape':
        return (
          <ShapesControls
            canvas={canvas}
            selectedObject={null}
            onUpdate={handleUpdate}
            embedded
          />
        );
      
      default:
        return (
          <ObjectControls
            canvas={canvas}
            selectedObject={null}
            onUpdate={handleUpdate}
            embedded
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      {/* Left Toolbar */}
      <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />

      {/* Main Canvas Area */}
      <EditorCanvas
        canvas={canvas}
        setCanvas={setCanvas}
        onSelectionChange={handleSelectionChange}
        onCanvasChange={handleCanvasChange}
      />

      {/* Right Sidebar (Options + Preview) */}
      <aside className="w-[420px] bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Options</span>
          <button
            onClick={() => setIsPreviewVisible((prev) => !prev)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isPreviewVisible ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        <div
          className={`flex-1 min-h-0 grid ${
            isPreviewVisible ? 'grid-cols-[1fr_220px]' : 'grid-cols-1'
          }`}
        >
          <div className="min-h-0 overflow-y-auto">{renderRightPanel()}</div>

          {isPreviewVisible && (
            <div className="border-l border-gray-100">
              <PreviewPanel canvas={canvas} embedded />
            </div>
          )}
        </div>

        {isPreviewVisible && (
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => setIsPreviewVisible(false)}
              className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              Masquer l'aperçu
            </button>
          </div>
        )}
      </aside>

      {/* Quick Start Guide */}
      <QuickStartGuide />
    </div>
  );
}
