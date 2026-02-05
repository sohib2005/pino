'use client';

import React from 'react';

interface BlockingOrder {
  id: string;
  orderNumber: string;
  status: string;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  productName: string;
  blockingOrders: BlockingOrder[];
  onClose: () => void;
  onDeleteWithOrders: () => void;
  onKeepInTrash: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  productName,
  blockingOrders,
  onClose,
  onDeleteWithOrders,
  onKeepInTrash,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                ⚠️ Suppression bloquée
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {productName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Ce produit est lié à <strong>{blockingOrders.length} commande(s)</strong> en cours de traitement.
              Vous devez choisir comment procéder :
            </p>
          </div>

          {/* Blocking Orders List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Commandes bloquantes :
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {blockingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'EN_ATTENTE' ? 'En attente' :
                     order.status === 'EN_COURS' ? 'En cours' :
                     order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Option A: Delete everything */}
            <button
              onClick={onDeleteWithOrders}
              className="w-full p-4 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg text-left transition-colors group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-red-900">
                    Option A : Supprimer les commandes ET le produit
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    ⚠️ ATTENTION : Ceci supprimera définitivement les {blockingOrders.length} commande(s)
                    bloquante(s) ainsi que le produit. Cette action est irréversible.
                  </p>
                </div>
              </div>
            </button>

            {/* Option B: Keep in trash */}
            <button
              onClick={onKeepInTrash}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 rounded-lg text-left transition-colors group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Option B : Garder dans la corbeille
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Le produit restera dans l'historique de suppression. Vous pourrez le supprimer
                    définitivement plus tard quand les commandes seront livrées.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
