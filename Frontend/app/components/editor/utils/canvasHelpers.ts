/**
 * Canvas Helper Functions
 * Utility functions for canvas operations
 */

import { fabric } from 'fabric';
import { RealDimensions, PrintArea } from '../types';

// DPI for print quality
export const PRINT_DPI = 300;
export const SCREEN_DPI = 96;

/**
 * Calculate real-world dimensions in centimeters
 */
export function calculateRealDimensions(
  pixelWidth: number,
  pixelHeight: number,
  dpi: number = PRINT_DPI
): RealDimensions {
  const inchesWidth = pixelWidth / dpi;
  const inchesHeight = pixelHeight / dpi;
  
  // Convert inches to cm (1 inch = 2.54 cm)
  const widthCm = parseFloat((inchesWidth * 2.54).toFixed(2));
  const heightCm = parseFloat((inchesHeight * 2.54).toFixed(2));
  
  return { widthCm, heightCm };
}

/**
 * Calculate pixel dimensions from cm
 */
export function cmToPixels(cm: number, dpi: number = PRINT_DPI): number {
  const inches = cm / 2.54;
  return Math.round(inches * dpi);
}

/**
 * Initialize print area rectangle with dashed border
 */
export function createPrintAreaBoundary(printArea: PrintArea): fabric.Rect {
  return new fabric.Rect({
    left: printArea.x,
    top: printArea.y,
    width: printArea.width,
    height: printArea.height,
    fill: 'transparent',
    stroke: '#4AC4E5',
    strokeWidth: 2,
      strokeDashArray: [2, 6],
      strokeLineCap: 'round',
      rx: 40,
      ry: 40,
    selectable: false,
    evented: false,
    name: 'printAreaBoundary',
  });
}

/**
 * Constrain object within print area
 */
export function constrainToPrintArea(obj: fabric.Object, printArea: PrintArea): void {
  if (!obj) return;

  const objBound = obj.getBoundingRect();
  
  let { left, top } = obj;
  
  // Constrain horizontal position
  if (objBound.left < printArea.x) {
    left = obj.left! + (printArea.x - objBound.left);
  } else if (objBound.left + objBound.width > printArea.x + printArea.width) {
    left = obj.left! - (objBound.left + objBound.width - (printArea.x + printArea.width));
  }
  
  // Constrain vertical position
  if (objBound.top < printArea.y) {
    top = obj.top! + (printArea.y - objBound.top);
  } else if (objBound.top + objBound.height > printArea.y + printArea.height) {
    top = obj.top! - (objBound.top + objBound.height - (printArea.y + printArea.height));
  }
  
  obj.set({ left, top });
  obj.setCoords();
}

/**
 * Snap object to center
 */
export function snapToCenter(
  obj: fabric.Object,
  canvas: fabric.Canvas,
  threshold: number = 10
): void {
  if (!obj || !canvas) return;

  const canvasCenter = {
    x: canvas.width! / 2,
    y: canvas.height! / 2,
  };

  const objCenter = obj.getCenterPoint();

  // Snap horizontally
  if (Math.abs(objCenter.x - canvasCenter.x) < threshold) {
    obj.centerH();
  }

  // Snap vertically
  if (Math.abs(objCenter.y - canvasCenter.y) < threshold) {
    obj.centerV();
  }

  obj.setCoords();
}

/**
 * Generate unique ID for canvas objects
 */
export function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get object bounds in pixels
 */
export function getObjectBounds(obj: fabric.Object): {
  width: number;
  height: number;
} {
  const bound = obj.getBoundingRect();
  return {
    width: Math.round(bound.width),
    height: Math.round(bound.height),
  };
}

/**
 * Check if object is a text object
 */
export function isTextObject(obj: fabric.Object | null): obj is fabric.Text {
  return obj !== null && (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox');
}

/**
 * Check if object is an image object
 */
export function isImageObject(obj: fabric.Object | null): obj is fabric.Image {
  return obj !== null && obj.type === 'image';
}

/**
 * Add drop shadow to object
 */
export function addShadow(obj: fabric.Object): void {
  obj.set({
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 10,
      offsetX: 3,
      offsetY: 3,
    }),
  });
}

/**
 * Remove shadow from object
 */
export function removeShadow(obj: fabric.Object): void {
  obj.set({ shadow: undefined });
}

/**
 * Center object on canvas
 */
export function centerObject(obj: fabric.Object, canvas: fabric.Canvas): void {
  obj.center();
  canvas.renderAll();
}
