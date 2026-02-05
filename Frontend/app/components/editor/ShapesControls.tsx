/**
 * ShapesControls Component
 * Add and customize shapes
 */

'use client';

import { useState } from 'react';
import { fabric } from 'fabric';
import { Square, Circle, Triangle, Star, Heart } from 'lucide-react';

interface ShapesControlsProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onUpdate: () => void;
  embedded?: boolean;
}

export default function ShapesControls({ canvas, selectedObject, onUpdate, embedded = false }: ShapesControlsProps) {
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle' | 'triangle' | 'star' | 'heart'>('rectangle');

  const addRectangle = () => {
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      width: 150,
      height: 100,
      fill: fillColor,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    onUpdate();
  };

  const addCircle = () => {
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      radius: 75,
      fill: fillColor,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    onUpdate();
  };

  const addTriangle = () => {
    if (!canvas) return;

    const triangle = new fabric.Triangle({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      width: 150,
      height: 130,
      fill: fillColor,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
    onUpdate();
  };

  const addStar = () => {
    if (!canvas) return;

    const star = new fabric.Polygon(
      [
        { x: 50, y: 0 },
        { x: 61, y: 35 },
        { x: 98, y: 35 },
        { x: 68, y: 57 },
        { x: 79, y: 91 },
        { x: 50, y: 70 },
        { x: 21, y: 91 },
        { x: 32, y: 57 },
        { x: 2, y: 35 },
        { x: 39, y: 35 },
      ],
      {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        fill: fillColor,
        stroke: strokeWidth > 0 ? strokeColor : undefined,
        strokeWidth: strokeWidth,
        originX: 'center',
        originY: 'center',
      }
    );

    canvas.add(star);
    canvas.setActiveObject(star);
    canvas.renderAll();
    onUpdate();
  };

  const addHeart = () => {
    if (!canvas) return;

    const heartPath = 'M 50 20 C 20 0, 0 20, 0 40 C 0 60, 20 80, 50 100 C 80 80, 100 60, 100 40 C 100 20, 80 0, 50 20 Z';
    
    const heart = new fabric.Path(heartPath, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fill: fillColor,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      originX: 'center',
      originY: 'center',
      scaleX: 1.5,
      scaleY: 1.5,
    });

    canvas.add(heart);
    canvas.setActiveObject(heart);
    canvas.renderAll();
    onUpdate();
  };

  const shapes = [
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Cercle' },
    { id: 'triangle' as const, icon: Triangle, label: 'Triangle' },
    { id: 'star' as const, icon: Star, label: 'Étoile' },
    { id: 'heart' as const, icon: Heart, label: 'Cœur' },
  ];

  const handleAddShape = () => {
    switch (selectedShape) {
      case 'rectangle':
        addRectangle();
        break;
      case 'circle':
        addCircle();
        break;
      case 'triangle':
        addTriangle();
        break;
      case 'star':
        addStar();
        break;
      case 'heart':
        addHeart();
        break;
      default:
        break;
    }
  };

  const containerClass = embedded
    ? 'h-full min-h-0 overflow-y-auto'
    : 'w-80 h-full min-h-0 bg-white border-l border-gray-200 overflow-y-auto shadow-sm';

  return (
    <div className={containerClass}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Formes</h2>
          <p className="text-sm text-gray-600">Ajoutez des formes à votre design</p>
        </div>

        {/* Shape Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Choisir une forme</h3>
          <div className="grid grid-cols-2 gap-3">
            {shapes.map((shape) => {
              const Icon = shape.icon;
              const isActive = selectedShape === shape.id;
              return (
                <button
                  key={shape.id}
                  onClick={() => setSelectedShape(shape.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                    isActive
                      ? 'border-pino-blue bg-pino-blue-subtle text-pino-blue'
                      : 'border-gray-200 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {shape.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Settings */}
        <div className="space-y-4 mb-6">
          {/* Fill Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur de remplissage
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          {/* Stroke */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Épaisseur du contour : <span className="text-pino-blue">{strokeWidth}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
            />
          </div>

          {strokeWidth > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur du contour
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAddShape}
          className="w-full px-4 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors duration-200 font-semibold"
        >
          Ajouter la forme
        </button>

      </div>
    </div>
  );
}
