import React, { useState, useEffect } from 'react';
import { UserProfile, ThemeMode } from '../types/finance';
import { playSuccessChime, triggerHaptic, playKeypadTone } from '../utils/feedback';

interface ProfileModalProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onClose: () => void;
  onSignOut?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
];

interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  icon: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Oscuro Cyber',
    description: 'Pizarra profundo de alto contraste',
    icon: 'dark_mode',
    previewBg: '#0b1326',
    previewCard: '#131b2e',
    previewAccent: '#4edea3',
  },
  {
    id: 'light',
    name: 'Claro Puro',
    description: 'Diurno minimalista y limpio',
    icon: 'light_mode',
    previewBg: '#f1f5f9',
    previewCard: '#ffffff',
    previewAccent: '#059669',
  },
  {
    id: 'midnight',
    name: 'Medianoche OLED',
    description: 'Negro puro 0% emisión de luz',
    icon: 'nightlight',
    previewBg: '#000000',
    previewCard: '#0f0f0f',
    previewAccent: '#4edea3',
  },
  {
    id: 'emerald',
    name: 'Esmeralda Finanzas',
    description: 'Verde boutique de banca privada',
    icon: 'account_balance',
    previewBg: '#04140e',
    previewCard: '#08261b',
    previewAccent: '#4edea3',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSaveProfile,
  onClose,
  onSignOut,
}) => {
  const [name, setName] = useState(profile.name || 'Lucas Collazo');
  const [email, setEmail] = useState(profile.email || 'collazolucas@gmail.com');
  const [bio, setBio] = useState(profile.bio || 'Gestión patrimonial & finanzas personales');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || AVATAR_PRESETS[0]);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(profile.theme || 'dark');

  // Ensure no sensitive Supabase config remains in client localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('capitalfocus_supabase_config_v1');
    } catch {
      // ignore
    }
  }, []);

  const handleSelectTheme = (selectedTheme: ThemeMode) => {
    setTheme(selectedTheme);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    triggerHaptic(15);
    playKeypadTone(520, 15);
  };

  const handleClose = () => {
    document.documentElement.setAttribute('data-theme', profile.theme || 'dark');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        triggerHaptic(15);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomAvatarSubmit = () => {
    if (customAvatarInput.trim()) {
      setAvatarUrl(customAvatarInput.trim());
      setCustomAvatarInput('');
      triggerHaptic(10);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'Usuario',
      email: email.trim(),
      bio: bio.trim(),
      avatarUrl,
      theme,
    });
    playSuccessChime();
    triggerHaptic(25);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#171f33] border border-white/10 rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[22px]">
              account_circle
            </span>
            <h3 className="font-sans text-base font-bold text-white tracking-tight">
              Perfil de Usuario
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#222a3d] hover:bg-[#2d3449] text-[#bbcabf] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Current Avatar preview with edit indicator */}
        <div className="flex flex-col items-center justify-center gap-2 py-1">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#4edea3]/30 shadow-lg bg-[#222a3d]">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = AVATAR_PRESETS[0];
                }}
              />
            </div>
            <label
              htmlFor="avatar-file-upload"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#4edea3] text-[#003824] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
              title="Subir foto desde dispositivo"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">photo_camera</span>
            </label>
            <input
              id="avatar-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <span className="text-[11px] text-[#bbcabf]">
            Toca el icono de cámara para subir una foto
          </span>
        </div>

        {/* Avatar Preset Options */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#bbcabf] font-medium">O elige un avatar predefinido</label>
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAvatarUrl(preset);
                  playKeypadTone(500 + idx * 50, 15);
                  triggerHaptic(8);
                }}
                className={`w-11 h-11 rounded-full overflow-hidden flex-shrink-0 transition-all border-2 cursor-pointer ${
                  avatarUrl === preset
                    ? 'border-[#4edea3] scale-105 shadow-[0_0_10px_rgba(78,222,163,0.5)]'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-[#bbcabf] font-medium">Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div>
            <label className="text-xs text-[#bbcabf] font-medium">Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div>
            <label className="text-xs text-[#bbcabf] font-medium">Nota / Estado del perfil</label>
            <input
              type="text"
              placeholder="Descripción breve..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div>
            <label className="text-xs text-[#bbcabf] font-medium">URL de Imagen externa (opcional)</label>
            <div className="flex gap-1.5 mt-1">
              <input
                type="url"
                placeholder="https://..."
                value={customAvatarInput}
                onChange={(e) => setCustomAvatarInput(e.target.value)}
                className="flex-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
              />
              <button
                type="button"
                onClick={handleCustomAvatarSubmit}
                className="px-3 py-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#4edea3] cursor-pointer"
              >
                Cargar
              </button>
            </div>
          </div>

          {/* Selector de Tema de la Aplicación */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[19px]">
                  palette
                </span>
                <label className="text-xs text-[#bbcabf] font-sans font-semibold">
                  Tema &amp; Apariencia
                </label>
              </div>
              <span className="text-[10px] text-[#4edea3] font-num font-bold px-2 py-0.5 rounded-md bg-[#222a3d] border border-white/5">
                {THEMES.find((t) => t.id === theme)?.name || 'Oscuro'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-2 relative group cursor-pointer ${
                      isSelected
                        ? 'border-[#4edea3] bg-[#222a3d] shadow-md scale-[1.02]'
                        : 'border-white/10 bg-[#0b1326] hover:bg-[#1b2233]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-6 rounded-lg border border-white/10 overflow-hidden flex p-0.5 gap-0.5 shadow-inner"
                        style={{ backgroundColor: t.previewBg }}
                      >
                        <div
                          className="w-3.5 h-full rounded-sm"
                          style={{ backgroundColor: t.previewCard }}
                        />
                        <div
                          className="w-2.5 h-full rounded-sm ml-auto"
                          style={{ backgroundColor: t.previewAccent }}
                        />
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#4edea3] text-[#003824] flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-[13px] font-bold">
                            check
                          </span>
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-[#86948a] group-hover:text-white">
                          {t.icon}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-sans text-xs font-bold text-white leading-tight">
                        {t.name}
                      </span>
                      <span className="font-sans text-[10px] text-[#bbcabf] leading-snug mt-0.5">
                        {t.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-white/5 mt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#4edea3] hover:bg-[#45caa2] text-[#003824] text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Guardar Perfil
            </button>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                playKeypadTone(350, 40);
                onSignOut();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              Cerrar Sesión
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
