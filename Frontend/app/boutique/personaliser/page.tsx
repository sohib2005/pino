'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/app/components/Header';
import { useCustomAlert } from '@/app/hooks/useCustomAlert';
import CustomAlert from '@/app/components/CustomAlert';
import Footer from '@/app/components/Footer';
import PersonalizationEditor, {
  dataUrlToFile,
  type PersonalizationEditorHandle,
} from '@/app/components/personalization/PersonalizationEditor';
import { cartApi, personalizationsApi, productsApi, uploadsApi, type Product } from '@/lib/api';
import { useRouter } from 'next/navigation';

function isWhiteTshirt(p: Product) {
  const name = (p.name || '').toLowerCase();
  const color = (p.color || '').toLowerCase();
  return (name.includes('t-shirt') || name.includes('tshirt')) && (color.includes('blanc') || name.includes('blanc'));
}

export default function PersonaliserPage() {
  const router = useRouter();
  const { alertConfig, isOpen, hideAlert, showError, showSuccess, showWarning } = useCustomAlert();

  const editorRef = useRef<PersonalizationEditorHandle | null>(null);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const products = await productsApi.getAll();
        const white = products.find(isWhiteTshirt) || null;
        setProduct(white);

        const firstSize = white?.variants?.[0]?.size?.name;
        if (firstSize) setSelectedSize(firstSize);
      } catch (e: any) {
        console.error(e);
        showError(e.message || 'Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.size?.name === selectedSize) || product.variants[0];
  }, [product, selectedSize]);

  const availableStock = selectedVariant?.stock ?? 0;

  const sizeSelector = (
    <div className="border border-gray-200 rounded-lg p-3 space-y-4">
      <div>
        <div className="text-xs font-semibold text-gray-500">Taille</div>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold bg-white"
          disabled={!product?.variants?.length}
        >
          {(product?.variants || []).map((v) => (
            <option key={v.id} value={v.size?.name} disabled={(v.stock ?? 0) <= 0}>
              {v.size?.name} {(v.stock ?? 0) <= 0 ? '(Rupture)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500">Quantité</div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50"
            disabled={quantity <= 1}
          >
            -
          </button>
          <div className="w-8 text-center font-semibold text-sm">{quantity}</div>
          <button
            onClick={() => setQuantity((q) => Math.min(availableStock || 999, q + 1))}
            className="w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50"
            disabled={availableStock > 0 ? quantity >= availableStock : true}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const mobileSizeControl = (
    <div className="text-sm font-semibold text-gray-800">
      <label className="sr-only">Taille</label>
      <select
        value={selectedSize}
        onChange={(e) => setSelectedSize(e.target.value)}
        className="bg-transparent text-sm font-semibold focus:outline-none"
        disabled={!product?.variants?.length}
      >
        {(product?.variants || []).map((v) => (
          <option key={v.id} value={v.size?.name} disabled={(v.stock ?? 0) <= 0}>
            Taille: {v.size?.name}
          </option>
        ))}
      </select>
    </div>
  );


  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      showError('Produit "T-shirt blanc" introuvable ou sans variantes');
      return;
    }

    if (quantity <= 0) {
      showWarning('Quantité invalide');
      return;
    }

    if (availableStock < quantity) {
      showError(`Stock insuffisant. Seulement ${availableStock} disponible(s) pour cette taille.`);
      return;
    }

    try {
      setSubmitting(true);

      const exports = await editorRef.current?.exportViews();
      if (!exports?.front || !exports?.back) {
        showError('Veuillez créer un design pour AVANT et ARRIÈRE.');
        return;
      }

      // Upload preview + print files (front + back)
      const ts = Date.now();

      const frontPreviewFile = dataUrlToFile(exports.front.previewPngDataUrl, `tshirt-avant-preview-${ts}.png`);
      const frontPrintFile = dataUrlToFile(exports.front.printPngDataUrl, `tshirt-avant-print-${ts}.png`);
      const backPreviewFile = dataUrlToFile(exports.back.previewPngDataUrl, `tshirt-dos-preview-${ts}.png`);
      const backPrintFile = dataUrlToFile(exports.back.printPngDataUrl, `tshirt-dos-print-${ts}.png`);

      const [frontPreviewUpload, frontPrintUpload, backPreviewUpload, backPrintUpload] = await Promise.all([
        uploadsApi.uploadPersonalized(frontPreviewFile),
        uploadsApi.uploadPersonalized(frontPrintFile),
        uploadsApi.uploadPersonalized(backPreviewFile),
        uploadsApi.uploadPersonalized(backPrintFile),
      ]);

      // Store BOTH views in ONE Personalization.designJson (no DB change)
      const designJson = {
        editor: {
          type: 'fabric',
          version: 'v1',
        },
        front: {
          viewType: 'AVANT',
          previewUrl: frontPreviewUpload.url,
          printUrl: frontPrintUpload.url,
        },
        back: {
          viewType: 'DOS',
          previewUrl: backPreviewUpload.url,
          printUrl: backPrintUpload.url,
        },
      };

      const personalization = await personalizationsApi.create({
        viewType: 'AVANT',
        previewUrl: frontPreviewUpload.url,
        printUrl: frontPrintUpload.url,
        designJson,
      });

      await cartApi.add(selectedVariant.id, quantity, personalization.id);

      showSuccess('T-shirt personnalisé ajouté au panier !');
      setTimeout(() => router.push('/cart'), 500);
    } catch (e: any) {
      console.error(e);
      showError(e.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setSubmitting(false);
    }
  };

  const addToCartButton = (
    <button
      onClick={handleAddToCart}
      disabled={loading || submitting || !product || !selectedVariant}
      className="px-4 py-2 rounded-lg bg-pino-blue text-white text-sm font-semibold hover:bg-pino-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting ? 'Ajout...' : 'Ajouter au panier'}
    </button>
  );

  return (
    <>
      <Header />

      <div className="bg-gray-50 pt-20">
        <div className="max-w-none w-full h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-pino-blue" />
              <div className="mt-3 text-gray-600">Chargement...</div>
            </div>
          ) : !product ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10">
              <div className="text-lg font-semibold text-gray-900">T-shirt blanc introuvable</div>
              <p className="text-gray-600 mt-2">
                Créez un produit "T-shirt blanc" avec des variantes (XS → XXL) dans l’admin produits.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <PersonalizationEditor
                ref={editorRef}
                title={product?.name || 'Personnalisation T-shirt blanc'}
                previewFooter={sizeSelector}
                canvasActions={addToCartButton}
                mobileSizeControl={mobileSizeControl}
                frontMockupUrl="/imgs/tshirt-blanc-avant.png"
                backMockupUrl="/imgs/tshirt-blanc-dos.png"
              />
            </div>
          )}
        </div>
      </div>

      <CustomAlert
        isOpen={isOpen}
        onClose={hideAlert}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        type={alertConfig?.type ?? 'success'}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
        onConfirm={alertConfig?.onConfirm}
      />
      <Footer />
    </>
  );
}
