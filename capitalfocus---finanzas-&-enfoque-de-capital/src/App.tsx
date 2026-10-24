import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { FinanceData, Transaction, FixedExpense, FixedIncome, SavingsGoal, DebtItem } from './types/finance';
import { loadFinanceData, saveFinanceData, EMPTY_FINANCE_DATA } from './utils/storage';
import { LockScreen } from './components/LockScreen';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { BottomNav, AppTab } from './components/BottomNav';
import { TransactionsScreen } from './components/TransactionsScreen';
import { FocusScreen } from './components/FocusScreen';
import { ManagementScreen, ManagementSubpage } from './components/ManagementScreen';
import { ProfileModal } from './components/ProfileModal';
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase';
import {
  fetchRemoteFinanceData,
  syncTransactionRemote,
  deleteTransactionRemote,
  clearTransactionsRemote,
  syncFixedExpenseRemote,
  deleteFixedExpenseRemote,
  syncFixedIncomeRemote,
  deleteFixedIncomeRemote,
  syncSavingsGoalRemote,
  deleteSavingsGoalRemote,
  syncDebtRemote,
  deleteDebtRemote,
  syncProfileRemote,
} from './services/supabaseSync';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [financeData, setFinanceData] = useState<FinanceData>(EMPTY_FINANCE_DATA);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<AppTab>('movimientos');
  const [managementSubpage, setManagementSubpage] = useState<ManagementSubpage>('fijos');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Load finance data for a specific user ID
  const loadUserData = useCallback(async (userId: string) => {
    // 1. Instant optimistic load from user-scoped localStorage
    const local = loadFinanceData(userId);
    setFinanceData(local);

    // 2. Fetch authoritative state from Supabase
    if (isSupabaseConfigured()) {
      try {
        const remote = await fetchRemoteFinanceData(userId);
        if (remote) {
          setFinanceData(remote);
          saveFinanceData(remote, userId);
        }
      } catch (err) {
        console.warn('Silent cloud sync note:', err);
      }
    }
  }, []);

  // Initialize Supabase session & listen to auth state changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      // Offline fallback mode
      setAuthLoading(false);
      setFinanceData(loadFinanceData());
      return;
    }

    // Check existing persisted session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession) {
        loadUserData(existingSession.user.id);
      }
      setAuthLoading(false);
    });

    // Real-time subscription to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        loadUserData(currentSession.user.id);
      } else {
        setFinanceData(EMPTY_FINANCE_DATA);
        setIsLocked(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Persist state changes to user-scoped local storage
  useEffect(() => {
    if (session?.user?.id) {
      saveFinanceData(financeData, session.user.id);
    }
  }, [financeData, session?.user?.id]);

  // Synchronize active theme with document
  const currentTheme = financeData.userProfile?.theme || 'dark';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setIsLocked(true);
    setShowProfileModal(false);
    setFinanceData(EMPTY_FINANCE_DATA);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      transactions: [created, ...prev.transactions],
    }));
    syncTransactionRemote(created);
  };

  const handleDeleteTransaction = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    deleteTransactionRemote(id);
  };

  const handleEditTransaction = (updatedTx: Transaction) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
    }));
    syncTransactionRemote(updatedTx);
  };

  const handleResetMonth = () => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: [],
    }));
    clearTransactionsRemote();
  };

  const handleAddFixedExpense = (item: Omit<FixedExpense, 'id'>) => {
    const created: FixedExpense = {
      ...item,
      id: `fix-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      fixedExpenses: [...prev.fixedExpenses, created],
    }));
    syncFixedExpenseRemote(created);
  };

  const handleUpdateFixedExpense = (updated: FixedExpense) => {
    setFinanceData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((f) => (f.id === updated.id ? updated : f)),
    }));
    syncFixedExpenseRemote(updated);
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((f) => f.id !== id),
    }));
    deleteFixedExpenseRemote(id);
  };

  const handleAddFixedIncome = (item: Omit<FixedIncome, 'id'>) => {
    const created: FixedIncome = {
      ...item,
      id: `inc-${Date.now()}`,
    };
    setFinanceData((prev) => {
      const currentIncomes = prev.fixedIncomes || [];
      const nextIncomes = [...currentIncomes, created];
      const nextBaseIncome = nextIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      return {
        ...prev,
        fixedIncomes: nextIncomes,
        baseIncome: nextBaseIncome,
      };
    });
    syncFixedIncomeRemote(created);
  };

  const handleUpdateFixedIncome = (updated: FixedIncome) => {
    setFinanceData((prev) => {
      const currentIncomes = prev.fixedIncomes || [];
      const nextIncomes = currentIncomes.map((i) => (i.id === updated.id ? updated : i));
      const nextBaseIncome = nextIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      return {
        ...prev,
        fixedIncomes: nextIncomes,
        baseIncome: nextBaseIncome,
      };
    });
    syncFixedIncomeRemote(updated);
  };

  const handleDeleteFixedIncome = (id: string) => {
    setFinanceData((prev) => {
      const currentIncomes = prev.fixedIncomes || [];
      const nextIncomes = currentIncomes.filter((i) => i.id !== id);
      const nextBaseIncome = nextIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      return {
        ...prev,
        fixedIncomes: nextIncomes,
        baseIncome: nextBaseIncome,
      };
    });
    deleteFixedIncomeRemote(id);
  };

  const handleAddSavingsGoal = (
    item: Omit<SavingsGoal, 'id'>,
    applyCurrentMonth: boolean = false
  ) => {
    const goalId = `save-${Date.now()}`;
    const monthly = item.monthlyContribution;
    const shouldApplyNow = Boolean(applyCurrentMonth && monthly && monthly > 0);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const created: SavingsGoal = {
      ...item,
      id: goalId,
      currentAmount: (item.currentAmount || 0) + (shouldApplyNow ? monthly! : 0),
      lastContributionMonth: shouldApplyNow || (monthly && monthly > 0) ? currentMonthKey : undefined,
      autoContributeEnabled: true,
    };

    let autoTx: Transaction | null = null;
    if (shouldApplyNow) {
      const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toISOString().split('T')[0];

      autoTx = {
        id: `tx-auto-save-${goalId}-${currentMonthKey}`,
        type: 'expense',
        amount: monthly!,
        concept: `Aporte mensual automático: ${item.name}`,
        category: 'Ahorro',
        dateStr,
        timeStr,
        icon: 'savings',
        currency: '€',
      };
    }

    setFinanceData((prev) => {
      return {
        ...prev,
        transactions: autoTx ? [autoTx, ...prev.transactions] : prev.transactions,
        savingsGoals: [...prev.savingsGoals, created],
      };
    });

    syncSavingsGoalRemote(created);
    if (autoTx) {
      syncTransactionRemote(autoTx);
    }
  };

  const handleContributeSavings = (goalId: string, amount: number) => {
    const targetGoal = financeData.savingsGoals.find((g) => g.id === goalId);
    const goalName = targetGoal ? targetGoal.name : 'Meta de Ahorro';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = now.toISOString().split('T')[0];

    const contributionTx: Transaction = {
      id: `tx-save-${Date.now()}`,
      type: 'expense',
      amount,
      concept: `Aporte a ahorro: ${goalName}`,
      category: 'Ahorro',
      dateStr,
      timeStr,
      icon: 'savings',
      currency: '€',
    };

    setFinanceData((prev) => {
      return {
        ...prev,
        transactions: [contributionTx, ...prev.transactions],
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === goalId ? { ...g, currentAmount: (g.currentAmount || 0) + amount } : g
        ),
      };
    });

    syncTransactionRemote(contributionTx);
    if (targetGoal) {
      syncSavingsGoalRemote({
        ...targetGoal,
        currentAmount: (targetGoal.currentAmount || 0) + amount,
      });
    }
  };

  const handleDeleteSavingsGoal = (goalId: string) => {
    setFinanceData((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId),
    }));
    deleteSavingsGoalRemote(goalId);
  };

  const handleUpdateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setFinanceData((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
    }));
    syncSavingsGoalRemote(updatedGoal);
  };

  const handleAmortizeDebt = (debtId: string, amount: number) => {
    const targetDebt = financeData.debts.find((d) => d.id === debtId);
    const debtName = targetDebt ? targetDebt.name : 'Deuda';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = now.toISOString().split('T')[0];

    const amortizationTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'expense',
      amount,
      concept: `Amortización deuda: ${debtName}`,
      category: 'Deuda / Amortización',
      dateStr,
      timeStr,
      icon: 'trending_down',
      currency: '€',
    };

    setFinanceData((prev) => {
      return {
        ...prev,
        transactions: [amortizationTx, ...prev.transactions],
        debts: prev.debts.map((d) =>
          d.id === debtId
            ? {
                ...d,
                amortizedAmount: Math.min(d.initialAmount, (d.amortizedAmount || 0) + amount),
              }
            : d
        ),
      };
    });

    syncTransactionRemote(amortizationTx);
    if (targetDebt) {
      syncDebtRemote({
        ...targetDebt,
        amortizedAmount: Math.min(targetDebt.initialAmount, (targetDebt.amortizedAmount || 0) + amount),
      });
    }
  };

  const handleUpdateProfile = (updatedProfile: NonNullable<FinanceData['userProfile']>) => {
    setFinanceData((prev) => ({
      ...prev,
      userProfile: updatedProfile,
    }));
    syncProfileRemote(updatedProfile, financeData.pinCode, financeData.currency, financeData.baseIncome);
  };

  const handleAddDebt = (debt: Omit<DebtItem, 'id'>) => {
    const created: DebtItem = {
      ...debt,
      id: `debt-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      debts: [...prev.debts, created],
    }));
    syncDebtRemote(created);
  };

  const handleDeleteDebt = (debtId: string) => {
    setFinanceData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== debtId),
    }));
    deleteDebtRemote(debtId);
  };

  const handleUpdateDebt = (updatedDebt: DebtItem) => {
    setFinanceData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)),
    }));
    syncDebtRemote(updatedDebt);
  };

  const handleUpdatePin = (newPin: string) => {
    setFinanceData((prev) => ({
      ...prev,
      pinCode: newPin,
    }));
    if (financeData.userProfile) {
      syncProfileRemote(financeData.userProfile, newPin, financeData.currency, financeData.baseIncome);
    }
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'movimientos':
        return 'Transacciones';
      case 'foco':
        return 'Vista De Foco';
      case 'gestion':
        if (managementSubpage === 'ahorro') return 'Gestión • Ahorro';
        if (managementSubpage === 'deuda') return 'Gestión • Deuda';
        return 'Gestión • Fijos';
      default:
        return 'CapitalFocus';
    }
  };

  // 1. Initial Auth Loading Splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-[#4edea3]/30 shadow-lg bg-[#131b2e] flex items-center justify-center">
            <img src="/icon-192.png" alt="Loading" className="w-full h-full object-cover" />
          </div>
          <span className="material-symbols-outlined text-[#4edea3] text-2xl animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-[#bbcabf] font-mono tracking-wide">Cargando CapitalFocus...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated User Screen
  if (!session) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  // 3. Authenticated but Locked Screen
  if (isLocked) {
    return (
      <LockScreen
        storedPin={financeData.pinCode || '1234'}
        onUnlocked={() => setIsLocked(false)}
        onUpdatePin={handleUpdatePin}
        userAvatarUrl={financeData.userProfile?.avatarUrl}
        onSignOut={handleSignOut}
      />
    );
  }

  // 4. Main Application Workspace
  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header
        currentViewTitle={getHeaderTitle()}
        onLockApp={() => setIsLocked(true)}
        userAvatarUrl={financeData.userProfile?.avatarUrl}
        userName={financeData.userProfile?.name}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 px-4 pb-20 max-w-lg mx-auto overflow-y-auto">
        {currentTab === 'movimientos' && (
          <TransactionsScreen
            transactions={financeData.transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
            onResetMonth={handleResetMonth}
          />
        )}

        {currentTab === 'foco' && <FocusScreen data={financeData} />}

        {currentTab === 'gestion' && (
          <ManagementScreen
            data={financeData}
            activeSubpage={managementSubpage}
            onSubpageChange={setManagementSubpage}
            onAddFixedExpense={handleAddFixedExpense}
            onUpdateFixedExpense={handleUpdateFixedExpense}
            onDeleteFixedExpense={handleDeleteFixedExpense}
            onAddFixedIncome={handleAddFixedIncome}
            onUpdateFixedIncome={handleUpdateFixedIncome}
            onDeleteFixedIncome={handleDeleteFixedIncome}
            onAddSavingsGoal={handleAddSavingsGoal}
            onContributeSavings={handleContributeSavings}
            onDeleteSavingsGoal={handleDeleteSavingsGoal}
            onUpdateSavingsGoal={handleUpdateSavingsGoal}
            onAmortizeDebt={handleAmortizeDebt}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={
            financeData.userProfile || {
              name: session.user.user_metadata?.full_name || 'Usuario',
              email: session.user.email || '',
              avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
              bio: 'Gestión patrimonial & finanzas personales',
              theme: 'dark',
            }
          }
          onSaveProfile={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
