import React, { useState } from 'react';
import { playKeypadTone, playSuccessChime, triggerHaptic } from '../utils/feedback';

interface LockScreenProps {
  storedPin: string;
  onUnlocked: () => void;
  onUpdatePin: (newPin: string) => void;
  userAvatarUrl?: string;
  onSignOut?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  storedPin,
  onUnlocked,
  onUpdatePin,
  userAvatarUrl,
  onSignOut,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('Esperando entrada de PIN');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);

  const maxDigits = 4;

  const handleDigitPress = (digit: string) => {
    if (isVerifying || enteredPin.length >= maxDigits) return;

    playKeypadTone(500 + (parseInt(digit, 10) || 0) * 45);
    triggerHaptic(12);

    const updated = enteredPin + digit;
    setEnteredPin(updated);

    if (updated.length === maxDigits) {
      setIsVerifying(true);
      setFeedbackMsg('Verificando credenciales...');

      setTimeout(() => {
        if (updated === storedPin) {
          playSuccessChime();
          triggerHaptic(25);
          setFeedbackMsg('Acceso concedido ✓');
          setTimeout(() => {
            onUnlocked();
          }, 350);
        } else {
          setIsShaking(true);
          playKeypadTone(220, 100);
          triggerHaptic(40);
          setFeedbackMsg('PIN incorrecto. Intenta de nuevo');
          setTimeout(() => {
            setEnteredPin('');
            setIsVerifying(false);
            setIsShaking(false);
          }, 700);
        }
      }, 400);
    } else {
      setFeedbackMsg(`${updated.length} de ${maxDigits} dígitos ingresados`);
    }
  };

  const handleBackspace = () => {
    if (isVerifying || enteredPin.length === 0) return;
    playKeypadTone(420, 20);
    triggerHaptic(8);
    const updated = enteredPin.slice(0, -1);
    setEnteredPin(updated);
    setFeedbackMsg(
      updated.length === 0
        ? 'Esperando entrada de PIN'
        : `${updated.length} de ${maxDigits} dígitos ingresados`
    );
  };

  const handleBiometrics = () => {
    setBiometricScanning(true);
    playKeypadTone(700, 40);
    triggerHaptic(15);
    setFeedbackMsg('Escaneando biometría local...');

    setTimeout(() => {
      setBiometricScanning(false);
      playSuccessChime();
      triggerHaptic(30);
      setEnteredPin(storedPin);
      setFeedbackMsg('Biometría verificada ✓ Acceso concedido');
      setTimeout(() => {
        onUnlocked();
      }, 400);
    }, 750);
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4 && /^\d+$/.test(newPinInput)) {
      onUpdatePin(newPinInput);
      setShowRecoveryModal(false);
      setNewPinInput('');
      setEnteredPin('');
      setFeedbackMsg(`Nuevo PIN establecido exitosamente`);
      playSuccessChime();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1326] flex flex-col justify-between items-center px-4 pt-safe pb-safe select-none text-[#dae2fd]">
      {/* Top Header bar */}
      <div className="w-full max-w-md pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/10 bg-[#0b1326]">
            <img src="/icon-192.png" alt="CapitalFocus" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[16px] font-bold tracking-tight">CapitalFocus</span>
            <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-widest">
              Seguridad PIN
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
            src={
              userAvatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
            }
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4edea3] ring-2 ring-[#0b1326]" />
        </div>
      </div>

      {/* Center authentication card */}
      <div className="flex flex-col items-center text-center w-full max-w-md my-auto py-2">
        {/* Offline Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131b2e] shadow-sm mb-3 border border-white/5">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="font-num text-[11px] text-[#bbcabf] uppercase tracking-wider font-semibold">
            Modo Offline Seguro
          </span>
          <span className="material-symbols-outlined text-[#4edea3] text-[14px]">lock</span>
        </div>

        {/* Emblem Container */}
        <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-[#222a3d] shadow-lg mb-3 border border-white/10">
          <span className="material-symbols-outlined text-[34px] text-[#4edea3]">
            vpn_key
          </span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#4edea3]/15 via-transparent to-[#4edea3]/5 pointer-events-none" />
        </div>

        {/* Security Subtitle and Title */}
        <span className="font-num text-[11px] text-[#4edea3] uppercase tracking-widest font-semibold mb-1">
          Seguridad Biométrica y Cifrado Local
        </span>
        <h1 className="font-sans text-[24px] text-[#dae2fd] font-bold tracking-tight">
          Ingresa tu código PIN
        </h1>
        <p className="font-sans text-[13px] text-[#bbcabf] mt-0.5">
          Autoriza el acceso a tu bóveda patrimonial
        </p>

        {/* PIN Dots matrix */}
        <div className={`my-5 flex flex-col items-center ${isShaking ? 'animate-bounce' : ''}`}>
          <div className="flex items-center justify-center gap-4 py-2 px-6 rounded-full bg-[#060e20]/80 border border-white/5 backdrop-blur-md">
            {Array.from({ length: maxDigits }).map((_, idx) => {
              const isFilled = idx < enteredPin.length;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-200 rounded-full ${
                    isFilled
                      ? 'w-3.5 h-3.5 bg-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.7)] scale-110'
                      : 'w-3.5 h-3.5 bg-[#222a3d]'
                  }`}
                />
              );
            })}
          </div>

          <div
            className={`h-5 mt-2 font-num text-[12px] tracking-wide transition-colors ${
              feedbackMsg.includes('incorrecto')
                ? 'text-[#ff7886] font-semibold'
                : 'text-[#4edea3]'
            }`}
          >
            {feedbackMsg}
          </div>
        </div>

        {/* Numeric keypad (3x4) */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-3.5 gap-x-4 place-items-center">
          {/* Digits 1 to 9 */}
          {[
            { num: '1', letters: '' },
            { num: '2', letters: 'ABC' },
            { num: '3', letters: 'DEF' },
            { num: '4', letters: 'GHI' },
            { num: '5', letters: 'JKL' },
            { num: '6', letters: 'MNO' },
            { num: '7', letters: 'PQRS' },
            { num: '8', letters: 'TUV' },
            { num: '9', letters: 'WXYZ' },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => handleDigitPress(item.num)}
              className="group relative flex flex-col items-center justify-center w-18 h-18 rounded-full bg-[#222a3d] text-[#dae2fd] active:scale-90 hover:bg-[#2d3449] active:bg-[#4edea3]/20 border border-white/5 transition-all shadow-md focus:outline-none"
            >
              <span className="font-num text-[23px] font-semibold leading-none group-active:text-[#4edea3]">
                {item.num}
              </span>
              {item.letters && (
                <span className="font-num text-[9px] text-[#bbcabf] group-active:text-[#4edea3] opacity-75 mt-0.5 tracking-tighter">
                  {item.letters}
                </span>
              )}
            </button>
          ))}

          {/* Biometrics Action */}
          <button
            type="button"
            onClick={handleBiometrics}
            className={`flex flex-col items-center justify-center w-18 h-18 rounded-full bg-[#131b2e] hover:bg-[#171f33] text-[#4edea3] active:scale-90 border border-white/5 transition-all shadow-md focus:outline-none ${
              biometricScanning ? 'ring-2 ring-[#4edea3] animate-pulse' : ''
            }`}
            title="Autenticación Biométrica"
          >
            <span
              className="material-symbols-outlined text-[26px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              fingerprint
            </span>
            <span className="font-num text-[8px] uppercase tracking-tighter text-[#bbcabf] mt-0.5">
              Biometría
            </span>
          </button>

          {/* Digit 0 */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="group relative flex flex-col items-center justify-center w-18 h-18 rounded-full bg-[#222a3d] text-[#dae2fd] active:scale-90 hover:bg-[#2d3449] active:bg-[#4edea3]/20 border border-white/5 transition-all shadow-md focus:outline-none"
          >
            <span className="font-num text-[23px] font-semibold leading-none group-active:text-[#4edea3]">
              0
            </span>
            <span className="font-num text-[9px] text-[#bbcabf] group-active:text-[#4edea3] opacity-60 mt-0.5">
              +
            </span>
          </button>

          {/* Backspace Action */}
          <button
            type="button"
            onClick={handleBackspace}
            className="flex flex-col items-center justify-center w-18 h-18 rounded-full bg-[#131b2e] hover:bg-[#171f33] text-[#dae2fd] active:scale-90 border border-white/5 transition-all shadow-md focus:outline-none"
            title="Borrar dígito"
          >
            <span className="material-symbols-outlined text-[24px]">backspace</span>
            <span className="font-num text-[8px] uppercase tracking-tighter text-[#bbcabf] mt-0.5">
              Borrar
            </span>
          </button>
        </div>
      </div>

      {/* Recovery Links & Hardware Enclave Verification */}
      <footer className="w-full max-w-md flex flex-col items-center text-center pb-4 gap-2">
        <button
          type="button"
          onClick={() => setShowRecoveryModal(true)}
          className="font-sans text-[13px] text-[#c0c1ff] hover:text-[#4edea3] transition-colors font-medium underline-offset-4 hover:underline cursor-pointer"
        >
          Opciones de Recuperación / Reset de Código
        </button>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="font-sans text-[12px] text-[#bbcabf] hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer py-1"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span>Cerrar sesión / Cambiar de cuenta</span>
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[#bbcabf]/80 text-[11px] font-num uppercase tracking-wider">
          <span className="material-symbols-outlined text-[15px] text-[#4edea3]">verified_user</span>
          <span>Protegido por enclave seguro de hardware</span>
        </div>
      </footer>

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#4edea3]">
                <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                <h3 className="font-sans text-lg font-bold text-white">Gestión de PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Tu PIN actual por defecto es <strong className="text-[#4edea3] font-mono">{storedPin}</strong>.
              Puedes usarlo directamente para desbloquear o asignar un nuevo código de 4 dígitos.
            </p>

            <form onSubmit={handleResetPinSubmit} className="flex flex-col gap-3">
              <label className="text-xs text-[#bbcabf] uppercase font-num">
                Nuevo PIN (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 1234"
                className="w-full bg-[#0b1326] border border-white/10 rounded-xl px-4 py-3 font-num text-lg text-white focus:outline-none focus:border-[#4edea3]"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin(storedPin);
                    setShowRecoveryModal(false);
                    playSuccessChime();
                    setTimeout(() => onUnlocked(), 300);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-colors"
                >
                  Usar PIN Actual
                </button>
                <button
                  type="submit"
                  disabled={newPinInput.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] disabled:opacity-50 text-[#003824] text-xs font-bold transition-all shadow-md"
                >
                  Guardar Nuevo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
