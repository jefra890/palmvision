'use client';

import { useState, useCallback } from 'react';
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth, useToast } from '@/app/providers';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToast('Perfil actualizado', 'success');
    setIsSaving(false);
  }, [addToast]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-purple-300/70 mt-1">Administra tu informacion personal</p>
        </div>

        {/* Avatar */}
        <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user?.name || 'Usuario'}</h2>
              <p className="text-purple-400/60">{user?.email}</p>
              <p className="text-xs text-purple-400/40 mt-1">Miembro desde hoy</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Informacion Personal</h3>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-purple-900/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-purple-900/30 rounded-lg text-purple-400/60 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-purple-400/40 mt-1">El email no se puede cambiar</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tu Actividad</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-purple-300">0</p>
              <p className="text-xs text-purple-400/50 mt-1">Lecturas realizadas</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-purple-300">3</p>
              <p className="text-xs text-purple-400/50 mt-1">Lecturas restantes</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">Gratis</p>
              <p className="text-xs text-purple-400/50 mt-1">Plan actual</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
