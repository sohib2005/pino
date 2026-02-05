/**
 * T-Shirt Design Editor Type Definitions
 * Professional type system for the editor
 */

import { fabric } from 'fabric';

export type ToolType = 'text' | 'image' | 'shape' | 'upload' | 'design-library' | 'select';

export interface EditorState {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  activeToolType: ToolType | null;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fill: string;
  textAlign: string;
  charSpacing: number;
  lineHeight: number;
  underline: boolean;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RealDimensions {
  widthCm: number;
  heightCm: number;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg';
  quality: number;
  dpi: number;
  transparentBackground: boolean;
}

export interface HistoryState {
  canvasState: string;
  timestamp: number;
}

export interface CanvasObject extends fabric.Object {
  id?: string;
  type?: string;
}

// Font options available in the editor
export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Arial Black',
] as const;

// Shape types
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'polygon';

// Alignment options
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

// Layer actions
export type LayerAction = 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back';
