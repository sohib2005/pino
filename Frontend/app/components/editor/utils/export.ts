/**
 * Export Utilities
 * Handle design export to various formats
 */

import { fabric } from 'fabric';
import { ExportOptions } from '../types';

/**
 * Export canvas as PNG/JPG
 */
export function exportCanvas(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | null {
  if (!canvas) return null;

  const multiplier = options.dpi / 96; // Scale factor for DPI

  return canvas.toDataURL({
    format: options.format,
    quality: options.quality,
    multiplier,
    enableRetinaScaling: true,
  });
}

/**
 * Download exported design
 */
export function downloadDesign(
  dataUrl: string,
  filename: string = 'tshirt-design'
): void {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export design with transparent background
 */
export function exportWithTransparency(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | null {
  if (!canvas) return null;

  const originalBg = canvas.backgroundColor;
  
  if (options.transparentBackground) {
    canvas.backgroundColor = 'transparent';
  }

  const dataUrl = exportCanvas(canvas, options);
  
  // Restore original background
  canvas.backgroundColor = originalBg;
  canvas.renderAll();

  return dataUrl;
}

/**
 * Export as SVG
 */
export function exportAsSVG(canvas: fabric.Canvas): string | null {
  if (!canvas) return null;

  return canvas.toSVG();
}

/**
 * Get canvas state as JSON
 */
export function getCanvasJSON(canvas: fabric.Canvas): string {
  return JSON.stringify(canvas.toJSON(['id', 'name']));
}

/**
 * Load canvas from JSON
 */
export function loadCanvasFromJSON(
  canvas: fabric.Canvas,
  json: string,
  callback?: () => void
): void {
  canvas.loadFromJSON(json, () => {
    canvas.renderAll();
    if (callback) callback();
  });
}

/**
 * Save design to localStorage
 */
export function saveToLocalStorage(canvas: fabric.Canvas, key: string = 'tshirt-design'): void {
  const json = getCanvasJSON(canvas);
  localStorage.setItem(key, json);
  localStorage.setItem(`${key}-timestamp`, Date.now().toString());
}

/**
 * Load design from localStorage
 */
export function loadFromLocalStorage(
  canvas: fabric.Canvas,
  key: string = 'tshirt-design'
): boolean {
  const json = localStorage.getItem(key);
  
  if (!json) return false;

  try {
    loadCanvasFromJSON(canvas, json);
    return true;
  } catch (error) {
    console.error('Failed to load design from localStorage:', error);
    return false;
  }
}

/**
 * Clear saved design
 */
export function clearSavedDesign(key: string = 'tshirt-design'): void {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}-timestamp`);
}
