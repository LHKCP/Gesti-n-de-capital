import React, { useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { playKeypadTone, playSuccessChime, triggerHaptic } from '../utils/feedback';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const handleModeChange = (newMode: 'signin' | 'signup' | 'forgot') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMode(newMode);
    triggerHaptic(10);
    playKeypadTone(520, 20);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Servicio de autenticación no inicializado.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    triggerHaptic(12);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Tu correo no ha sido confirmado aún. Revisa tu bandeja de entrada.');
        } else {
          setErrorMsg(error.message || 'Error al iniciar sesión.');
        }
        playKeypadTone(220, 100);
        triggerHaptic(30);
      } else if (data.session) {
        playSuccessChime();
        triggerHaptic(25);
        onAuthenticated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Servicio de autenticación no inicializado.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (pinCode && !/^\d{4}$/.test(pinCode)) {
      setErrorMsg('El PIN rápido debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    triggerHaptic(12);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || splitEmailName(email),
            pin_code: pinCode.trim() || '1234',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMsg('Este correo ya está registrado. Inicia sesión directamente.');
        } else {
          setErrorMsg(error.message || 'Error al registrar tu cuenta.');
        }
        playKeypadTone(220, 100);
        triggerHaptic(30);
      } else if (data.session) {
        // Direct session acquired
        playSuccessChime();
        triggerHaptic(25);
        onAuthenticated();
      } else {
        // Confirmation might be required or account created
        setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
        playSuccessChime();
        // Try direct sign in immediately
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (!signInErr) {
          onAuthenticated();
        } else {
          setSuccessMsg('Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!email) {
      setErrorMsg('Ingresa tu correo para recibir las instrucciones de recuperación.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Enlace de recuperación enviado. Revisa tu bandeja de entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const splitEmailName = (mail: string) => {
    const part = mail.split('@')[0] || 'Usuario';
    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col justify-center items-center px-4 py-8 select-none antialiased">
      {/* Brand & App Presentation */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mb-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl overflow-hidden ring-2 ring-[#4edea3]/40 shadow-[0_0_30px_rgba(78,222,163,0.25)] mb-3 bg-[#131b2e] flex items-center justify-center">
          <img
            src="/icon-192.png"
            alt="CapitalFocus Icon"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
          Capital<span className="text-[#4edea3]">Focus</span>
        </h1>
        <p className="text-xs text-[#bbcabf] font-medium tracking-wide mt-1">
          Finanzas &amp; Enfoque de Capital
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-sm bg-[#131b2e] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
        {/* Tab switchers */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 p-1 bg-[#0b1326] rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#222a3d] text-[#4edea3] shadow-md'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#222a3d] text-[#4edea3] shadow-md'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                lock_reset
              </span>
              Recuperar Contraseña
            </h2>
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className="text-xs text-[#bbcabf] hover:text-[#4edea3] cursor-pointer"
            >
              Volver
            </button>
          </div>
        )}

        {/* Notifications / Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-red-400 flex-shrink-0">
              error
            </span>
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-xs flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-[#4edea3] flex-shrink-0">
              check_circle
            </span>
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* Form: Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-[11px] text-[#4edea3] hover:underline cursor-pointer"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#86948a] hover:text-white cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-[#4edea3] hover:bg-[#45caa2] disabled:opacity-50 text-[#003824] font-bold text-sm shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Entrar a CapitalFocus</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Form: Sign Up */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider block mb-1">
                Tu Nombre
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  person
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Lucas Collazo"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider block mb-1">
                Contraseña (mínimo 6 caracteres)
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#86948a] hover:text-white cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider">
                  PIN rápido de desbloqueo (4 dígitos)
                </label>
                <span className="text-[10px] text-[#bbcabf]">Opcional (por defecto 1234)</span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  pin
                </span>
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm font-num tracking-widest text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-[#4edea3] hover:bg-[#45caa2] disabled:opacity-50 text-[#003824] font-bold text-sm shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Crear Cuenta y Empezar</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Form: Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Introduce tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-[#bbcabf] uppercase tracking-wider block mb-1">
                Correo Registrado
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#86948a]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4edea3] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-[#4edea3] hover:bg-[#45caa2] disabled:opacity-50 text-[#003824] font-bold text-sm shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}

        {/* Privacy badge */}
        <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[#bbcabf] text-[11px]">
          <span className="material-symbols-outlined text-[#4edea3] text-[15px]">
            encrypted
          </span>
          <span>Aislamiento estricto &amp; privacidad individual garantizada</span>
        </div>
      </div>
    </div>
  );
};
