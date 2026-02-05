'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

interface CustomOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  hotelName?: string;
  createdAt: string;
  items: Array<{
    id: number;
    printedName: string;
    textLanguage: string;
    withDjerbaLogo: boolean;
    quantity: number;
    unitPrice: number;
    variant: {
      product: {
        name: string;
        code: string;
      };
      size: {
        name: string;
      };
    };
  }>;
}

const reasonOptions = [
  { value: 'ERREUR_IMPRESSION', label: 'Erreur d\'impression' },
  { value: 'MAUVAISE_TAILLE', label: 'Mauvaise taille' },
  { value: 'MAUVAISE_LANGUE', label: 'Mauvaise langue' },
  { value: 'PRODUIT_DEFECTUEUX', label: 'Produit défectueux' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function ReturnRequestPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showWarning } = useCustomAlert();

  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableByItem, setAvailableByItem] = useState<Record<number, number>>({});
  
  const [reason, setReason] = useState('');
  const [userComment, setUserComment] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    customOrderItemId: number;
    quantityReturned: number;
    maxQuantity: number;
  }>>([]);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (Object.keys(availableByItem).length === 0) return;
    setSelectedItems((prev) => prev
      .filter((item) => (availableByItem[item.customOrderItemId] ?? item.maxQuantity) > 0)
      .map((item) => {
        const available = availableByItem[item.customOrderItemId] ?? item.maxQuantity;
        return {
          ...item,
          maxQuantity: available,
          quantityReturned: Math.min(item.quantityReturned, available),
        };
      })
    );
  }, [availableByItem]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Get user from localStorage
      const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
      const client = clientData ? JSON.parse(clientData) : null;
      
      if (!client?.id) {
        showError('Vous devez être connecté');
        router.push('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/custom-orders/${orderId}`, {
        headers: {
          'x-user-id': client.id
        }
      });
      if (!response.ok) throw new Error('Failed to fetch order');
      
      const data = await response.json();
      
      if (data.status !== 'LIVRE') {
        showWarning('Vous pouvez uniquement retourner des articles de commandes livrées');
        router.back();
        return;
      }
      
      setOrder(data);
      await fetchAvailableQuantities(client.id, data);
    } catch (error) {
      console.error('Error fetching order:', error);
      showError('Erreur lors du chargement de la commande');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableQuantities = async (userId: string, currentOrder: CustomOrder) => {
    try {
      const res = await fetch(`http://localhost:3001/returns/my/returns?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        setAvailableByItem({});
        return;
      }

      const returns = await res.json();
      const returnedMap: Record<number, number> = {};

      (Array.isArray(returns) ? returns : []).forEach((returnRecord: any) => {
        if (returnRecord?.customOrder?.id !== currentOrder.id) return;
        if (returnRecord?.status === 'REFUSE') return;

        const items = Array.isArray(returnRecord.items) ? returnRecord.items : [];
        items.forEach((item: any) => {
          const itemId = Number(item?.customOrderItem?.id ?? item?.customOrderItemId);
          if (!Number.isInteger(itemId)) return;
          const qty = Number(item?.quantityReturned || 0);
          returnedMap[itemId] = (returnedMap[itemId] || 0) + qty;
        });
      });

      const available: Record<number, number> = {};
      currentOrder.items.forEach((item) => {
        const returned = returnedMap[item.id] || 0;
        available[item.id] = Math.max(item.quantity - returned, 0);
      });

      setAvailableByItem(available);
    } catch (error) {
      console.error('Error fetching returns:', error);
      setAvailableByItem({});
    }
  };

  const handleItemSelect = (itemId: number, maxQty: number) => {
    const existing = selectedItems.find(si => si.customOrderItemId === itemId);
    
    if (existing) {
      setSelectedItems(selectedItems.filter(si => si.customOrderItemId !== itemId));
    } else {
      setSelectedItems([...selectedItems, {
        customOrderItemId: itemId,
        quantityReturned: 1,
        maxQuantity: maxQty,
      }]);
    }
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setSelectedItems(selectedItems.map(si => 
      si.customOrderItemId === itemId
        ? { ...si, quantityReturned: Math.min(Math.max(1, quantity), si.maxQuantity) }
        : si
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      showWarning('Veuillez sélectionner une raison');
      return;
    }
    
    if (selectedItems.length === 0) {
      showWarning('Veuillez sélectionner au moins un article');
      return;
    }

    if (selectedItems.some((item) => {
      const available = availableByItem[item.customOrderItemId] ?? item.maxQuantity;
      return available <= 0 || item.quantityReturned > available;
    })) {
      showWarning('La quantité sélectionnée dépasse le disponible pour retour');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get user from localStorage
      const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
      const client = clientData ? JSON.parse(clientData) : null;
      
      if (!client?.id) {
        showError('Vous devez être connecté');
        return;
      }
      
      const response = await fetch('http://localhost:3001/returns/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': client.id,
        },
        body: JSON.stringify({
          customOrderId: orderId,
          reason,
          userComment,
          items: selectedItems.map((item) => ({
            customOrderItemId: Number(item.customOrderItemId),
            quantityReturned: Number(item.quantityReturned),
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create return request');
      }

      showSuccess('Votre demande de retour a été envoyée avec succès!');
      router.push('/mes-retours');
    } catch (error: any) {
      console.error('Error submitting return:', error);
      showError(error.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12 mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
          <p className="text-center text-gray-600">Commande introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CustomAlert
        isOpen={isOpen}
        onClose={hideAlert}
        message={alertConfig?.message || ''}
        title={alertConfig?.title}
        type={alertConfig?.type}
        onConfirm={alertConfig?.onConfirm}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <button
          onClick={() => router.back()}
          className="text-pino-blue hover:underline mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Signaler un Problème</h1>
        <p className="text-gray-600 mb-6">
          Commande #{order.orderNumber}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Raison du retour</h2>
            <div className="space-y-2">
              {reasonOptions.map((option) => (
                <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-pino-blue focus:ring-pino-blue"
                  />
                  <span className="ml-3 text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Item Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Articles à retourner</h2>
            <div className="space-y-3">
              {order.items.map((item) => {
                const selected = selectedItems.find(si => si.customOrderItemId === item.id);
                const available = availableByItem[item.id] ?? item.quantity;
                const isUnavailable = available <= 0;
                
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selected ? 'border-pino-blue bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => handleItemSelect(item.id, available)}
                        className="mt-1 w-5 h-5 text-pino-blue focus:ring-pino-blue rounded"
                        disabled={isUnavailable}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.variant.product.code} - {item.variant.product.name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Nom imprimé: "{item.printedName}"
                            </p>
                            <p className="text-sm text-gray-600">
                              Taille: {item.variant.size.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Quantité commandée:</p>
                            <p className="font-bold text-gray-900">{item.quantity}</p>
                            <p className="text-sm text-gray-600 mt-1">Disponible:</p>
                            <p className="font-bold text-gray-900">{available}</p>
                          </div>
                        </div>

                        {isUnavailable && (
                          <p className="text-xs text-red-600 mt-2">
                            Déjà retourné ou non disponible
                          </p>
                        )}

                        {selected && !isUnavailable && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantité à retourner:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={selected.maxQuantity}
                              value={selected.quantityReturned}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Commentaire (optionnel)</h2>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème en détail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0 || !reason}
              className="flex-1 px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
