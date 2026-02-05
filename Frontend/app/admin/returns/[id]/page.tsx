'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

interface ReturnDetails {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  userComment?: string;
  adminComment?: string;
  createdAt: string;
  processedAt?: string;
  user: {
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
    email?: string;
    role: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    user: {
      firstName?: string;
      lastName?: string;
      phoneNumber: string;
    };
  };
  customOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    user: {
      firstName?: string;
      lastName?: string;
      phoneNumber: string;
    };
  };
  items: Array<{
    id: number;
    quantityReturned: number;
    action?: string;
    processed: boolean;
    refundAmount?: number;
    orderItem?: {
      id: number;
      quantity: number;
      unitPrice: number;
      variant: {
        sku: string;
        product: {
          name: string;
          code: string;
        };
        size: {
          name: string;
        };
      };
    };
    customOrderItem?: {
      id: number;
      quantity: number;
      unitPrice: number;
      printedName: string;
      textLanguage: string;
      withDjerbaLogo: boolean;
      variant: {
        sku: string;
        product: {
          name: string;
          code: string;
        };
        size: {
          name: string;
        };
      };
    };
    newVariant?: {
      product: {
        name: string;
      };
      size: {
        name: string;
      };
    };
  }>;
}

const statusLabels = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  EN_TRAITEMENT: 'En traitement',
  TRAITE: 'Traité',
  REFUSE: 'Refusé',
};

const reasonLabels = {
  ERREUR_IMPRESSION: 'Erreur d\'impression',
  MAUVAISE_TAILLE: 'Mauvaise taille',
  MAUVAISE_LANGUE: 'Mauvaise langue',
  PRODUIT_DEFECTUEUX: 'Produit défectueux',
  AUTRE: 'Autre',
};

const actionLabels = {
  REIMPRESSION: 'Réimpression',
  CHANGEMENT_TAILLE: 'Changement de taille',
  AVOIR: 'Avoir',
  REMBOURSEMENT: 'Remboursement',
};

export default function ReturnDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  const { alertConfig, isOpen, hideAlert, showSuccess, showError } = useCustomAlert();

  const [returnData, setReturnData] = useState<ReturnDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/returns/${returnId}`);
      if (!response.ok) throw new Error('Failed to fetch return details');
      
      const data = await response.json();
      setReturnData(data);
      setAdminComment(data.adminComment || '');
    } catch (error) {
      console.error('Error fetching return details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!returnData) return;

    try {
      setProcessing(true);
      const response = await fetch(`http://localhost:3001/returns/${returnId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminComment,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const updated = await response.json();
      setReturnData(updated);
      showSuccess(`Statut mis à jour: ${statusLabels[newStatus as keyof typeof statusLabels]}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur lors de la mise à jour du statut');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">Retour introuvable</p>
        </div>
      </div>
    );
  }

  const orderData = returnData.order || returnData.customOrder;
  const isCustomOrder = !!returnData.customOrder;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.back()}
              className="text-pino-blue hover:underline mb-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à la liste
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Retour {returnData.returnNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Créé le {new Date(returnData.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                returnData.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                returnData.status === 'APPROUVE' ? 'bg-blue-100 text-blue-800' :
                returnData.status === 'EN_TRAITEMENT' ? 'bg-purple-100 text-purple-800' :
                returnData.status === 'TRAITE' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {statusLabels[returnData.status as keyof typeof statusLabels]}
            </span>
          </div>
        </div>

        {/* Return Info Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations du Retour</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Raison</p>
              <p className="font-medium text-gray-900">
                {reasonLabels[returnData.reason as keyof typeof reasonLabels]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Commande liée</p>
              <p className="font-medium text-gray-900">
                {orderData?.orderNumber}
                {isCustomOrder && <span className="ml-2 text-xs text-purple-600">(Grande Commande)</span>}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Commentaire du client</p>
              <p className="text-gray-900">{returnData.userComment || 'Aucun commentaire'}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations Client</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Nom</p>
              <p className="font-medium text-gray-900">
                {returnData.user.firstName} {returnData.user.lastName}
                {returnData.user.role === 'ANIMATEUR' && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Animateur
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="font-medium text-gray-900">{returnData.user.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Returned Items */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Articles Retournés</h2>
          <div className="space-y-4">
            {returnData.items.map((item) => {
              const itemData = item.orderItem || item.customOrderItem;
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Comparison: Before and After Return */}
                  <div className="grid grid-cols-2 gap-6 mb-4 pb-4 border-b border-gray-200">
                    {/* LEFT: Before Return (Original Order) */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <h4 className="font-semibold text-blue-900">État Original</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Produit:</span>
                          <span className="font-medium text-gray-900">
                            {itemData?.variant.product.code} - {itemData?.variant.product.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Taille:</span>
                          <span className="font-medium text-gray-900">{itemData?.variant.size.name}</span>
                        </div>
                        {item.customOrderItem && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Nom imprimé:</span>
                            <span className="font-medium text-gray-900">"{item.customOrderItem.printedName}"</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-700">Quantité commandée:</span>
                          <span className="font-bold text-blue-900 text-lg">{itemData?.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Prix unitaire:</span>
                          <span className="font-medium text-gray-900">{Number(itemData?.unitPrice).toFixed(2)} TND</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="text-gray-700">Total:</span>
                          <span className="font-bold text-blue-900">
                            {(Number(itemData?.unitPrice) * (itemData?.quantity || 0)).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: After Return */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <h4 className="font-semibold text-orange-900">Après Retour</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Produit:</span>
                          <span className="font-medium text-gray-900">
                            {item.newVariant?.product.name || itemData?.variant.product.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Taille:</span>
                          <span className="font-medium text-gray-900">
                            {item.newVariant?.size.name || itemData?.variant.size.name}
                            {item.newVariant && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Modifié
                              </span>
                            )}
                          </span>
                        </div>
                        {item.customOrderItem && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Nom imprimé:</span>
                            <span className="font-medium text-gray-900">"{item.customOrderItem.printedName}"</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-700">Quantité retournée:</span>
                          <span className="font-bold text-red-600 text-lg">-{item.quantityReturned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Quantité restante:</span>
                          <span className="font-bold text-orange-900 text-lg">
                            {(itemData?.quantity || 0) - item.quantityReturned}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-orange-200">
                          <span className="text-gray-700">Montant retourné:</span>
                          <span className="font-bold text-red-600">
                            -{(Number(itemData?.unitPrice) * item.quantityReturned).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex justify-between items-center">
                    <div>
                      {item.processed ? (
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            ✓ Traité
                          </span>
                          <div className="text-sm">
                            <span className="text-gray-600">Action: </span>
                            <strong className="text-gray-900">{actionLabels[item.action as keyof typeof actionLabels]}</strong>
                          </div>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          ⏳ En attente
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-gray-900">
                        Impact: {((item.quantityReturned / (itemData?.quantity || 1)) * 100).toFixed(0)}% de la commande
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Actions */}
        {returnData.status !== 'TRAITE' && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Administrateur</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire administrateur
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                placeholder="Ajouter un commentaire..."
              />
            </div>

            <div className="flex gap-3">
              {returnData.status === 'EN_ATTENTE' && (
                <>
                  <button
                    onClick={() => updateStatus('APPROUVE')}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus('REFUSE')}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </>
              )}
              
              {returnData.status === 'APPROUVE' && (
                <button
                  onClick={() => updateStatus('EN_TRAITEMENT')}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Commencer le traitement
                </button>
              )}

              {returnData.status === 'EN_TRAITEMENT' && (
                <button
                  onClick={() => updateStatus('TRAITE')}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Marquer comme traité
                </button>
              )}
            </div>
          </div>
        )}

        {/* Admin Comment Display (if treated) */}
        {returnData.adminComment && returnData.status === 'TRAITE' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Commentaire administrateur</p>
            <p className="text-gray-900">{returnData.adminComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
