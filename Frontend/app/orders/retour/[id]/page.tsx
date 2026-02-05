'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi, Order } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/image';
import Link from 'next/link';
import CustomAlert from '@/app/components/CustomAlert';
import { useCustomAlert } from '@/app/hooks/useCustomAlert';

const returnReasons = [
  { value: 'ERREUR_IMPRESSION', label: 'Erreur d\'impression' },
  { value: 'MAUVAISE_TAILLE', label: 'Mauvaise taille' },
  { value: 'MAUVAISE_LANGUE', label: 'Mauvaise langue' },
  { value: 'PRODUIT_DEFECTUEUX', label: 'Produit défectueux' },
  { value: 'AUTRE', label: 'Autre' },
];

interface ReturnItem {
  orderItemId: number;
  quantityReturned: number;
}

export default function ReturnRequestPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { alertConfig, isOpen, hideAlert, showSuccess, showError } = useCustomAlert();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map());
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await ordersApi.getById(orderId);
      
      if (data.status !== 'LIVRE') {
        showError('Seules les commandes livrées peuvent faire l\'objet d\'un retour');
        setTimeout(() => router.push('/orders'), 2000);
        return;
      }
      
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      showError('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: number, maxQuantity: number) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.set(itemId, 1); // Default to 1
    }
    setSelectedItems(newSelected);
  };

  const updateQuantity = (itemId: number, quantity: number, maxQuantity: number) => {
    const newSelected = new Map(selectedItems);
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity));
    newSelected.set(itemId, validQuantity);
    setSelectedItems(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.size === 0) {
      showError('Veuillez sélectionner au moins un article');
      return;
    }

    if (!reason) {
      showError('Veuillez sélectionner une raison');
      return;
    }

    setSubmitting(true);

    try {
      const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
      const client = clientData ? JSON.parse(clientData) : null;

      if (!client?.id) {
        showError('Vous devez être connecté pour créer un retour');
        return;
      }

      const items: ReturnItem[] = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
        orderItemId: itemId,
        quantityReturned: quantity,
      }));

      const response = await fetch('http://localhost:3001/returns/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: client.id,
          orderId: orderId,
          reason: reason,
          description: description || undefined,
          items: items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du retour');
      }

      showSuccess('Demande de retour créée avec succès');
      setTimeout(() => router.push('/mes-retours'), 2000);
    } catch (error: any) {
      console.error('Error creating return:', error);
      showError(error.message || 'Erreur lors de la création du retour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Commande non trouvée</p>
            <Link href="/orders" className="mt-4 inline-block text-pino-blue hover:underline">
              Retour aux commandes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="text-pino-blue hover:underline mb-4 inline-block">
            ← Retour aux commandes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Signaler un problème</h1>
          <p className="text-gray-600 mt-2">Commande #{order.orderNumber}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sélectionnez les articles concernés
            </h2>
            
            <div className="space-y-4">
              {order.items.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const selectedQuantity = selectedItems.get(item.id) || 1;
                
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                      isSelected ? 'border-pino-blue bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => toggleItem(item.id, item.quantity)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id, item.quantity)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-pino-blue rounded"
                      />
                      
                      <img
                        src={resolveProductImageUrl(item.variant?.product) || '/imgs/IMG1.png'}
                        alt={item.variant?.product?.name || 'Product'}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                        }}
                      />
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.variant?.product?.name || 'Product'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.variant?.product?.color && `Couleur: ${item.variant.product.color}`}
                          {item.variant?.size?.name && ` • Taille: ${item.variant.size.name}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantité commandée: {item.quantity}
                        </p>
                      </div>

                      {isSelected && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <label className="text-sm text-gray-700 block mb-1">
                            Quantité à retourner
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={selectedQuantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value), item.quantity)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Raison du retour
            </h2>
            
            <div className="space-y-3">
              {returnReasons.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    reason === r.value ? 'border-pino-blue bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-pino-blue"
                  />
                  <span className="ml-3 text-gray-900">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description (optionnel)
            </h2>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème en détail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href="/orders"
              className="flex-1 px-6 py-3 text-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting || selectedItems.size === 0 || !reason}
              className="flex-1 px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi en cours...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          isOpen={isOpen}
          onClose={hideAlert}
          {...alertConfig}
        />
      )}
    </div>
  );
}
