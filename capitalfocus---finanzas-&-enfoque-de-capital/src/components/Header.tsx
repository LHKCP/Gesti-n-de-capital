import React from 'react';

interface HeaderProps {
  currentViewTitle: string;
  onLockApp: () => void;
  userAvatarUrl?: string;
  userName?: string;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentViewTitle,
  onLockApp,
  userAvatarUrl,
  userName,
  onOpenProfile,
}) => {
  const avatar =
    userAvatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-[#0b1326]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2.5">
          {/* Logo icon container */}
          <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#4edea3] shadow-sm relative overflow-hidden border border-white/10">
            <span className="material-symbols-outlined text-[20px] font-bold">
              account_balance_wallet
            </span>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#4edea3]/20 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <span className="font-sans text-[17px] leading-tight text-[#dae2fd] font-bold tracking-tight">
              CapitalFocus
            </span>
            <span className="font-num text-[10px] leading-tight text-[#bbcabf] uppercase tracking-widest font-medium">
              {currentViewTitle}
            </span>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Fixed Euro currency indicator */}
          <div className="flex items-center bg-[#171f33] px-2.5 py-1 rounded-full border border-white/5 shadow-inner">
            <span className="font-num text-xs text-[#4edea3] font-bold tracking-wider">
              EUR (€)
            </span>
          </div>

          {/* Quick Lock Button */}
          <button
            type="button"
            onClick={onLockApp}
            className="w-8 h-8 rounded-full bg-[#171f33] hover:bg-[#222a3d] text-[#bbcabf] hover:text-[#4edea3] flex items-center justify-center transition-colors border border-white/5"
            title="Bloquear con PIN"
          >
            <span className="material-symbols-outlined text-[17px]">lock</span>
          </button>

          {/* Profile Avatar with Live dot - Clickable to open Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative flex items-center justify-center rounded-full hover:ring-2 hover:ring-[#4edea3]/50 transition-all cursor-pointer group"
            title={userName ? `Perfil: ${userName}` : 'Ver perfil'}
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
              src={avatar}
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4edea3] ring-2 ring-[#0b1326]"
              title="Enclave Cifrado & Sincronizado"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

