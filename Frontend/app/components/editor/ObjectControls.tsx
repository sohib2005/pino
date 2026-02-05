/**
 * ObjectControls Component
 * Universal controls for any selected object
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  Copy,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { fabric } from 'fabric';
import { getObjectBounds } from './utils/canvasHelpers';
import { formatDimensions, getDimensionsFromBounds } from './utils/sizing';

interface ObjectControlsProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onUpdate: () => void;
  embedded?: boolean;
}

export default function ObjectControls({ canvas, selectedObject, onUpdate, embedded = false }: ObjectControlsProps) {
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [dimensions, setDimensions] = useState<string>('');

  // Update state when object changes
  useEffect(() => {
    if (selectedObject) {
      setOpacity(Math.round((selectedObject.opacity || 1) * 100));
      setRotation(Math.round(selectedObject.angle || 0));
      setIsLocked(selectedObject.lockMovementX || false);
      
      // Update dimensions
      const bounds = getObjectBounds(selectedObject);
      const realDims = getDimensionsFromBounds(bounds.width, bounds.height);
      setDimensions(formatDimensions(realDims));
    }
  }, [selectedObject]);

  const deleteObject = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const duplicateObject = () => {
    if (!canvas || !selectedObject) return;

    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      onUpdate();
    });
  };

  const bringForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const sendBackward = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendBackwards(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringToFront(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendToBack(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const flipHorizontal = () => {
    if (!selectedObject) return;
    selectedObject.set('flipX', !selectedObject.flipX);
    canvas?.renderAll();
    onUpdate();
  };

  const flipVertical = () => {
    if (!selectedObject) return;
    selectedObject.set('flipY', !selectedObject.flipY);
    canvas?.renderAll();
    onUpdate();
  };

  const toggleLock = () => {
    if (!selectedObject) return;
    const locked = !isLocked;
    selectedObject.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });
    setIsLocked(locked);
    canvas?.renderAll();
    onUpdate();
  };

  const updateOpacity = (value: number) => {
    if (!selectedObject) return;
    const opacityValue = value / 100;
    selectedObject.set('opacity', opacityValue);
    setOpacity(value);
    canvas?.renderAll();
    onUpdate();
  };

  const updateRotation = (value: number) => {
    if (!selectedObject) return;
    selectedObject.set('angle', value);
    setRotation(value);
    canvas?.renderAll();
    onUpdate();
  };

  const containerClass = embedded
    ? 'h-full min-h-0 overflow-y-auto'
    : 'w-80 h-full min-h-0 bg-white border-l border-gray-200 overflow-y-auto shadow-sm';

  const innerClass = embedded ? 'p-6' : 'p-6';

  if (!selectedObject) {
    return (
      <div className={containerClass}>
        <div className={innerClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Propriétés</h2>
          <div className="text-center py-12">
            <Layers className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun objet sélectionné</p>
            <p className="text-sm text-gray-400 mt-2">Sélectionnez un objet pour modifier ses propriétés</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={`${innerClass} space-y-6`}>
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Propriétés</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Type: <span className="font-medium text-gray-900">{selectedObject.type}</span></span>
            <button
              onClick={toggleLock}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : (
                <Unlock className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="bg-pino-blue-subtle rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Dimensions réelles</p>
          <p className="text-lg font-bold text-pino-blue">{dimensions}</p>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacité: <span className="text-pino-blue">{opacity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => updateOpacity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation: <span className="text-pino-blue">{rotation}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => updateRotation(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
          />
        </div>

        {/* Transform Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transformation</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={flipHorizontal}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
            >
              <FlipHorizontal className="w-4 h-4" />
              Miroir H
            </button>
            <button
              onClick={flipVertical}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
            >
              <FlipVertical className="w-4 h-4" />
              Miroir V
            </button>
          </div>
        </div>

        {/* Layer Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Layer Order</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={bringForward}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 text-sm font-medium"
            >
              Forward
            </button>
            <button
              onClick={sendBackward}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 text-sm font-medium"
            >
              Backward
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={bringToFront}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 text-sm font-medium"
            >
              To Front
            </button>
            <button
              onClick={sendToBack}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 text-sm font-medium"
            >
              To Back
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 space-y-2">
          <button
            onClick={duplicateObject}
            className="w-full px-4 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={deleteObject}
            className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
