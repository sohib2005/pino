/**
 * Toolbar Component
 * Left sidebar with tool icons and labels
 */

'use client';

import { Type, Image, Shapes, MousePointer } from 'lucide-react';
import { ToolType } from './types';

interface ToolbarProps {
  activeTool: ToolType | null;
  onToolSelect: (tool: ToolType) => void;
}

interface Tool {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const tools: Tool[] = [
  {
    id: 'select',
    icon: <MousePointer className="w-5 h-5" />,
    label: 'Sélection',
    description: 'Sélectionner et déplacer',
  },
  {
    id: 'text',
    icon: <Type className="w-5 h-5" />,
    label: 'Texte',
    description: 'Ajouter du texte',
  },
  {
    id: 'image',
    icon: <Image className="w-5 h-5" />,
    label: 'Images',
    description: 'Ajouter des images',
  },
  {
    id: 'shape',
    icon: <Shapes className="w-5 h-5" />,
    label: 'Formes',
    description: 'Ajouter des formes',
  },
];

export default function Toolbar({ activeTool, onToolSelect }: ToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 w-full h-14 sm:static sm:w-16 sm:h-auto bg-white border-t sm:border-t-0 sm:border-b-0 sm:border-r border-gray-200 flex flex-row sm:flex-col items-center px-3 sm:px-0 py-0 sm:py-5 gap-2 shadow-sm">
      {/* Logo/Brand */}
      <div className="hidden sm:flex sm:mb-4 sm:pb-4 sm:border-b border-gray-200 w-auto sm:w-full justify-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-pino-blue rounded-full flex items-center justify-center shadow">
          <Type className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-full px-1 overflow-x-auto sm:overflow-visible">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`
                group relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl
                transition-all duration-200 
                ${
                  isActive
                    ? 'bg-pino-blue text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-pino-blue'
                }
              `}
              title={tool.description}
            >
              {/* Icon */}
              <div className="transition-transform duration-200 group-hover:scale-110">
                {tool.icon}
              </div>

              {/* Label */}
              <span className="text-[9px] font-medium text-center leading-tight hidden sm:inline">
                {tool.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pino-blue-dark rounded-r-full" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                {tool.description}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings/Help at bottom */}
      <div className="border-t border-gray-200 pt-4 w-full px-2">
        <button
          className="w-full p-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-pino-blue transition-all duration-200 flex flex-col items-center gap-1"
          title="Help & Support"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium">Help</span>
        </button>
      </div>
    </div>
  );
}
