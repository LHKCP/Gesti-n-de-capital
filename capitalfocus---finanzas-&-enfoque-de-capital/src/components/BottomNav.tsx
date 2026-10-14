import React from 'react';

export type AppTab = 'movimientos' | 'foco' | 'gestion';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    {
      id: 'movimientos' as AppTab,
      label: 'Movimientos',
      icon: 'receipt_long',
    },
    {
      id: 'foco' as AppTab,
      label: 'Foco',
      icon: 'toll',
    },
    {
      id: 'gestion' as AppTab,
      label: 'Gestión',
      icon: 'layers',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-[#131b2e]/92 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.45)]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-[#4edea3] font-bold'
                  : 'text-[#bbcabf] hover:text-[#dae2fd]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-sans text-xs mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
