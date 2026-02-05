/**
 * ImageControls Component
 * Image upload and manipulation controls
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { fabric } from 'fabric';
import { templatesApi, type AlbumTemplate } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';

interface ImageControlsProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onUpdate: () => void;
  embedded?: boolean;
}

export default function ImageControls({ canvas, selectedObject, onUpdate, embedded = false }: ImageControlsProps) {
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState<AlbumTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSameOriginUrl = (url: string) => {
    try {
      if (url.startsWith('/')) return true;
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);
        const data = await templatesApi.getActive();
        setTemplates(data || []);
      } catch (error) {
        console.error('Error loading album templates:', error);
        setTemplatesError('Impossible de charger les modèles');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result as string;
      
      fabric.Image.fromURL(imgData, (img: fabric.Image) => {
        // Scale image to fit canvas
        const maxWidth = 300;
        const maxHeight = 300;
        
        if (img.width! > maxWidth || img.height! > maxHeight) {
          const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
          img.scale(scale);
        }

        img.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        onUpdate();
        setUploading(false);
      });
    };

    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addImageFromURL = async (url: string) => {
    if (!canvas) return;

    const resolvedUrl = resolveImageUrl(url) || url;
    setUploading(true);

    const loadAsDataUrl = async (targetUrl: string) => {
      const readBlob = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image blob'));
          reader.readAsDataURL(blob);
        });

      try {
        const response = await fetch(targetUrl, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Image fetch failed: ${response.status}`);
        }
        const blob = await response.blob();
        return await readBlob(blob);
      } catch {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(targetUrl)}`;
        const proxyResponse = await fetch(proxyUrl, { cache: 'no-store' });
        if (!proxyResponse.ok) {
          throw new Error(`Proxy fetch failed: ${proxyResponse.status}`);
        }
        const proxyBlob = await proxyResponse.blob();
        return await readBlob(proxyBlob);
      }
    };

    const placeImage = (imgEl: HTMLImageElement) => {
      const img = new fabric.Image(imgEl);
      const maxWidth = 300;
      const maxHeight = 300;

      if (img.width! > maxWidth || img.height! > maxHeight) {
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        img.scale(scale);
      }

      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
      });

      canvas.add(img);
      canvas.setActiveObject(img);

      const boundary = canvas.getObjects().find((o) => o.name === 'printAreaBoundary');
      if (boundary) canvas.bringToFront(boundary);

      canvas.renderAll();
      onUpdate();
      setUploading(false);
    };

    const tryLoad = async () => {
      try {
        if (!isSameOriginUrl(resolvedUrl)) {
          const dataUrl = await loadAsDataUrl(resolvedUrl);
          fabric.Image.fromURL(dataUrl, (img: fabric.Image) => {
            const imgEl = img.getElement() as HTMLImageElement;
            placeImage(imgEl);
          });
          return;
        }

        const imgEl = new Image();
        imgEl.onload = () => placeImage(imgEl);
        imgEl.onerror = () => setUploading(false);
        imgEl.src = resolvedUrl;
      } catch (error) {
        console.error('Failed to load album image:', error);
        setUploading(false);
      }
    };

    await tryLoad();
  };

  const deleteImage = () => {
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.renderAll();
    onUpdate();
  };

  const isImageSelected = selectedObject && selectedObject.type === 'image';

  const containerClass = embedded
    ? 'h-full min-h-0 overflow-y-auto'
    : 'w-80 h-full min-h-0 bg-white border-l border-gray-200 overflow-y-auto shadow-sm';

  return (
    <div className={containerClass}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Images</h2>
          <p className="text-sm text-gray-600">Importez ou sélectionnez des images</p>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-pino-blue hover:bg-pino-blue-subtle transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pino-blue-subtle group-hover:bg-pino-blue flex items-center justify-center transition-colors duration-200">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-pino-blue group-hover:text-white transition-colors duration-200" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-pino-blue transition-colors duration-200">
                  {uploading ? 'Importation...' : 'Importer une image'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG jusqu'à 10MB</p>
              </div>
            </div>
          </button>
        </div>

        {/* Album Templates */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Modèles (Album)</h3>
          {templatesLoading ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : templatesError ? (
            <div className="text-sm text-red-500">{templatesError}</div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => {
                const previewUrl = resolveImageUrl(template.imageUrl) || template.imageUrl;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => addImageFromURL(template.imageUrl)}
                    className="group relative border border-gray-200 rounded-lg overflow-hidden hover:border-pino-blue transition-colors"
                    title={template.name}
                  >
                    <img
                      src={previewUrl}
                      alt={template.name}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[10px] px-2 py-1 truncate">
                      {template.name}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Aucun modèle disponible.</div>
          )}
        </div>


        {/* Selected Image Controls */}
        {isImageSelected && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Options de l'image</h3>
            
            <div className="space-y-3">
              <button
                onClick={deleteImage}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer l'image
              </button>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Conseils :</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Faites glisser pour repositionner</li>
                  <li>• Faites glisser les coins pour redimensionner</li>
                  <li>• Tournez via la poignée</li>
                  <li>• Le ratio est conservé par défaut</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {!isImageSelected && !uploading && (
          <div className="text-center py-8 border-t border-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          </div>
        )}
      </div>
    </div>
  );
}
