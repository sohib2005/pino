/**
 * TextControls Component
 * Advanced text editing controls
 */

'use client';

import { useState, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { fabric } from 'fabric';
import { FONT_FAMILIES } from './types';

interface TextControlsProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onUpdate: () => void;
  embedded?: boolean;
}

export default function TextControls({ canvas, selectedObject, onUpdate, embedded = false }: TextControlsProps) {
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#000000');
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Update state when object changes
  useEffect(() => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox')) {
      const textObj = selectedObject as fabric.Text;
      setFontFamily(textObj.fontFamily || 'Arial');
      setFontSize(textObj.fontSize || 40);
      setColor(textObj.fill as string || '#000000');
      setCharSpacing(textObj.charSpacing || 0);
      setLineHeight(textObj.lineHeight || 1.2);
      setIsBold(textObj.fontWeight === 'bold');
      setIsItalic(textObj.fontStyle === 'italic');
      setIsUnderline(textObj.underline || false);
      setTextAlign(textObj.textAlign as 'left' | 'center' | 'right' || 'left');
    }
  }, [selectedObject]);

  const updateTextProperty = (property: string, value: any) => {
    if (!canvas || !selectedObject) return;

    selectedObject.set(property as any, value);
    canvas.renderAll();
    onUpdate();
  };

  const addNewText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Éditez ce texte', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    onUpdate();
  };

  const isTextSelected = selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox');

  const containerClass = embedded
    ? 'h-full min-h-0 overflow-y-auto'
    : 'w-80 h-full min-h-0 bg-white border-l border-gray-200 overflow-y-auto shadow-sm';

  return (
    <div className={containerClass}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Texte</h2>
          <button
            onClick={addNewText}
            className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors duration-200 text-sm font-medium shadow-md hover:shadow-lg"
          >
            Ajouter
          </button>
        </div>

        {isTextSelected ? (
          <div className="space-y-6">
            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Police
              </label>
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  updateTextProperty('fontFamily', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent transition-all duration-200"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille: <span className="text-pino-blue">{fontSize}px</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={fontSize}
                onChange={(e) => {
                  const size = parseInt(e.target.value);
                  setFontSize(size);
                  updateTextProperty('fontSize', size);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    updateTextProperty('fill', e.target.value);
                  }}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    updateTextProperty('fill', e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Text Style Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newBold = !isBold;
                    setIsBold(newBold);
                    updateTextProperty('fontWeight', newBold ? 'bold' : 'normal');
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    isBold
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <Bold className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    const newItalic = !isItalic;
                    setIsItalic(newItalic);
                    updateTextProperty('fontStyle', newItalic ? 'italic' : 'normal');
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    isItalic
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <Italic className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    const newUnderline = !isUnderline;
                    setIsUnderline(newUnderline);
                    updateTextProperty('underline', newUnderline);
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    isUnderline
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <Underline className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alignment
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTextAlign('left');
                    updateTextProperty('textAlign', 'left');
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    textAlign === 'left'
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <AlignLeft className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    setTextAlign('center');
                    updateTextProperty('textAlign', 'center');
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    textAlign === 'center'
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <AlignCenter className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    setTextAlign('right');
                    updateTextProperty('textAlign', 'right');
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    textAlign === 'right'
                      ? 'border-pino-blue bg-pino-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:border-pino-blue'
                  }`}
                >
                  <AlignRight className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Letter Spacing: <span className="text-pino-blue">{charSpacing}</span>
              </label>
              <input
                type="range"
                min="-100"
                max="500"
                value={charSpacing}
                onChange={(e) => {
                  const spacing = parseInt(e.target.value);
                  setCharSpacing(spacing);
                  updateTextProperty('charSpacing', spacing);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
              />
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Height: <span className="text-pino-blue">{lineHeight.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={lineHeight}
                onChange={(e) => {
                  const height = parseFloat(e.target.value);
                  setLineHeight(height);
                  updateTextProperty('lineHeight', height);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pino-blue"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Type className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No text selected</p>
            <p className="text-sm text-gray-400">Click "Add Text" to start designing</p>
          </div>
        )}
      </div>
    </div>
  );
}
