/**
 * Quick Start Guide Component
 * Help users get started with the editor
 */

'use client';

import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';

export default function QuickStartGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 p-3 bg-pino-blue text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        title="Show Quick Start Guide"
      >
        <Lightbulb className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-pino-blue to-pino-blue-dark text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <h3 className="font-bold text-lg">Quick Start</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <Step number={1} title="Select a Tool">
            Click on Text, Images, or Shapes from the left sidebar
          </Step>
          
          <Step number={2} title="Add to Canvas">
            Click "Add Text" or upload an image to start designing
          </Step>
          
          <Step number={3} title="Customize">
            Use the right panel to change colors, sizes, and properties
          </Step>
          
          <Step number={4} title="Position">
            Drag objects to position them. They'll snap to center!
          </Step>
          
          <Step number={5} title="Export">
            Click "Export Design" to download your creation
          </Step>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Keyboard Shortcuts</h4>
          <div className="space-y-1 text-xs">
            <Shortcut keys="Ctrl + Z" action="Undo" />
            <Shortcut keys="Ctrl + Y" action="Redo" />
            <Shortcut keys="Delete" action="Remove object" />
            <Shortcut keys="Ctrl + S" action="Save design" />
          </div>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900">
            <strong>💡 Pro Tip:</strong> Double-click text to edit it directly on the canvas!
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-pino-blue text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600">{children}</p>
      </div>
    </div>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex justify-between items-center">
      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
        {keys}
      </kbd>
      <span className="text-gray-600">{action}</span>
    </div>
  );
}
