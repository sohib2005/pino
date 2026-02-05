/**
 * Sizing and Dimension Utilities
 * Handle real-world size calculations and display
 */

import { RealDimensions } from '../types';
import { calculateRealDimensions, PRINT_DPI } from './canvasHelpers';

/**
 * Format dimensions for display
 * Example: "17.28 cm × 19.08 cm"
 */
export function formatDimensions(dimensions: RealDimensions): string {
  return `${dimensions.widthCm} cm × ${dimensions.heightCm} cm`;
}

/**
 * Get readable size label
 */
export function getSizeLabel(widthCm: number, heightCm: number): string {
  // Common t-shirt print sizes
  if (widthCm <= 10 && heightCm <= 10) return 'Small';
  if (widthCm <= 20 && heightCm <= 20) return 'Medium';
  if (widthCm <= 30 && heightCm <= 30) return 'Large';
  return 'Extra Large';
}

/**
 * Calculate dimensions from object bounds
 */
export function getDimensionsFromBounds(
  width: number,
  height: number,
  dpi: number = PRINT_DPI
): RealDimensions {
  return calculateRealDimensions(width, height, dpi);
}

/**
 * Validate if dimensions are within print limits
 */
export function isWithinPrintLimits(
  widthCm: number,
  heightCm: number,
  maxWidthCm: number = 35,
  maxHeightCm: number = 40
): boolean {
  return widthCm <= maxWidthCm && heightCm <= maxHeightCm;
}

/**
 * Get optimal canvas size for display
 */
export function getOptimalCanvasSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number = 1
): { width: number; height: number } {
  const maxWidth = containerWidth * 0.8;
  const maxHeight = containerHeight * 0.8;
  
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}
