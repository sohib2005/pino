'use client';

import { useEffect, useState } from 'react';
import { templatesApi, AlbumTemplate } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<AlbumTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AlbumTemplate | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    tags: '',
    isActive: true,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesApi.getAllAdmin();
      setTemplates(data);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Erreur lors du chargement' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', imageUrl: '', tags: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (template: AlbumTemplate) => {
    setEditing(template);
    setFormData({
      name: template.name,
      imageUrl: template.imageUrl,
      tags: template.tags || '',
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const upload = await templatesApi.upload(file);
      setFormData((prev) => ({ ...prev, imageUrl: upload.imageUrl }));
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Erreur upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.imageUrl.trim()) {
      setAlert({ type: 'error', message: 'Nom et image sont requis' });
      return;
    }

    try {
      if (editing) {
        await templatesApi.update(editing.id, {
          name: formData.name.trim(),
          imageUrl: formData.imageUrl.trim(),
          tags: formData.tags.trim() || undefined,
          isActive: formData.isActive,
        });
        setAlert({ type: 'success', message: 'Modèle mis à jour' });
      } else {
        await templatesApi.create({
          name: formData.name.trim(),
          imageUrl: formData.imageUrl.trim(),
          tags: formData.tags.trim() || undefined,
          isActive: formData.isActive,
        });
        setAlert({ type: 'success', message: 'Modèle créé' });
      }

      setShowModal(false);
      await fetchTemplates();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Erreur sauvegarde' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await templatesApi.delete(id);
      setAlert({ type: 'success', message: 'Modèle supprimé' });
      await fetchTemplates();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Erreur suppression' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèles (Album)</h1>
          <p className="text-gray-600">Gérez les images modèles utilisées dans l’éditeur</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark"
        >
          Ajouter un modèle
        </button>
      </div>

      {alert && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg ${
            alert.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {alert.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pino-blue" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={resolveImageUrl(template.imageUrl) || '/imgs/IMG1.png'}
                      alt={template.name}
                      className="h-12 w-12 rounded object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{template.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{template.tags || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEdit(template)}
                      className="text-pino-blue hover:text-pino-blue-dark mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {templates.length === 0 && (
            <div className="text-center py-10 text-gray-500">Aucun modèle trouvé</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Modifier le modèle' : 'Nouveau modèle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Tags (optionnel)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="tourisme, été, djerba"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                    disabled={uploading}
                    className="w-full"
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={resolveImageUrl(formData.imageUrl) || '/imgs/IMG1.png'}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Actif</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-pino-blue text-white py-2 rounded-lg hover:bg-pino-blue-dark"
                disabled={uploading}
              >
                {editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
