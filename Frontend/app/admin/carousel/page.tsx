'use client';

import { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/lib/image';

interface CarouselSlide {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlertModal {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [uploading, setUploading] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModal>({ show: false, type: 'success', message: '' });
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({ show: false, title: '', message: '', onConfirm: () => {} });
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    order: 0,
    isActive: true,
  });

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertModal({ show: true, type, message });
  };

  const closeAlert = () => {
    setAlertModal({ show: false, type: 'success', message: '' });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await fetch('http://localhost:3001/carousel/admin');
      if (!response.ok) throw new Error('Failed to fetch slides');
      const data = await response.json();
      setSlides(data);
    } catch (error) {
      console.error('Error fetching slides:', error);
      showAlert('error', 'Erreur lors du chargement des slides');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      showAlert('error', 'Seuls les fichiers image sont autorisés (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (30MB)
    if (file.size > 30 * 1024 * 1024) {
      showAlert('error', 'Le fichier ne doit pas dépasser 30MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/carousel/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      showAlert('success', 'Image uploadée avec succès!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('error', 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      showAlert('error', 'Veuillez uploader une image');
      return;
    }

    try {
      const url = editingSlide
        ? `http://localhost:3001/carousel/admin/${editingSlide.id}`
        : 'http://localhost:3001/carousel/admin';
      
      const method = editingSlide ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save slide');

      showAlert('success', editingSlide ? 'Slide modifiée avec succès!' : 'Slide créée avec succès!');
      setShowModal(false);
      resetForm();
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      showAlert('error', 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      imageUrl: slide.imageUrl,
      link: slide.link || '',
      order: slide.order,
      isActive: slide.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    showConfirm(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette slide ?',
      async () => {
        closeConfirm();
        try {
          const response = await fetch(`http://localhost:3001/carousel/admin/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete slide');

          showAlert('success', 'Slide supprimée avec succès!');
          fetchSlides();
        } catch (error) {
          console.error('Error deleting slide:', error);
          showAlert('error', 'Erreur lors de la suppression');
        }
      }
    );
  };

  const handleReorder = async () => {
    try {
      const slidesOrder = slides.map((slide) => ({
        id: slide.id,
        order: slide.order,
      }));

      const response = await fetch('http://localhost:3001/carousel/admin/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slidesOrder }),
      });

      if (!response.ok) throw new Error('Failed to reorder');

      showAlert('success', 'Ordre enregistré avec succès!');
      fetchSlides();
    } catch (error) {
      console.error('Error reordering:', error);
      showAlert('error', 'Erreur lors de la réorganisation');
    }
  };

  const resetForm = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      link: '',
      order: 0,
      isActive: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion du Carousel</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Ajouter une slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Aucune slide dans le carousel</p>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Créer la première slide
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sous-titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slides.map((slide) => (
                <tr key={slide.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={resolveImageUrl(slide.imageUrl) || '/imgs/IMG1.png'}
                      alt={slide.title || 'Slide'}
                      className="h-16 w-24 object-cover rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {slide.title || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {slide.subtitle || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={slide.order}
                      onChange={(e) => {
                        const newSlides = slides.map((s) =>
                          s.id === slide.id
                            ? { ...s, order: parseInt(e.target.value) || 0 }
                            : s
                        );
                        setSlides(newSlides);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:3001/carousel/admin/${slide.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isActive: !slide.isActive }),
                          });
                          if (!response.ok) throw new Error('Failed to toggle status');
                          await fetchSlides();
                        } catch (error) {
                          console.error('Error toggling status:', error);
                          alert('Erreur lors de la modification du statut');
                        }
                      }}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                        slide.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {slide.isActive ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(slide)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleReorder}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Enregistrer l'ordre
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-black">
              {editingSlide ? 'Modifier la slide' : 'Ajouter une slide'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre (max 120 caractères)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de la slide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-titre (max 220 caractères)
                  </label>
                  <input
                    type="text"
                    maxLength={220}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sous-titre de la slide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien (optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/boutique ou URL externe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {uploading && (
                    <p className="text-sm text-gray-500 mt-1">Upload en cours...</p>
                  )}
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={resolveImageUrl(formData.imageUrl) || '/imgs/IMG1.png'}
                        alt="Preview"
                        className="h-32 w-auto rounded border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut de la slide
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: true })}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        formData.isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✓ Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: false })}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        !formData.isActive
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✗ Inactive
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editingSlide ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-[60]" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  alertModal.type === 'success' ? 'bg-blue-100' : 'bg-blue-100'
                }`}>
                  {alertModal.type === 'success' ? (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {alertModal.type === 'success' ? 'Succès' : 'Erreur'}
                </h3>
                <p className="text-gray-600">{alertModal.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeAlert}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-[60]" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{confirmModal.title}</h3>
                <p className="text-gray-600">{confirmModal.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeConfirm}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
