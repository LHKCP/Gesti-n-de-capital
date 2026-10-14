import { useState, useEffect } from 'react';
import { FinanceData, Transaction, FixedExpense, FixedIncome, SavingsGoal, DebtItem } from './types/finance';
import { loadFinanceData, saveFinanceData } from './utils/storage';
import { checkAndProcessMonthlyContributions } from './utils/savingsAutomation';
import { LockScreen } from './components/LockScreen';
import { Header } from './components/Header';
import { BottomNav, AppTab } from './components/BottomNav';
import { TransactionsScreen } from './components/TransactionsScreen';
import { FocusScreen } from './components/FocusScreen';
import { ManagementScreen, ManagementSubpage } from './components/ManagementScreen';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  const [financeData, setFinanceData] = useState<FinanceData>(loadFinanceData);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<AppTab>('movimientos');
  const [managementSubpage, setManagementSubpage] = useState<ManagementSubpage>('fijos');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Persist state changes
  useEffect(() => {
    saveFinanceData(financeData);
  }, [financeData]);

  // Synchronize active theme with document
  const currentTheme = financeData.userProfile?.theme || 'dark';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      transactions: [created, ...prev.transactions],
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleEditTransaction = (updatedTx: Transaction) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
    }));
  };

  // Reset month: clear all variable movements (expenses and income in Movimientos)
  const handleResetMonth = () => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: [],
    }));
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
  };

  const handleUpdateFixedExpense = (updated: FixedExpense) => {
    setFinanceData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((f) => (f.id === updated.id ? updated : f)),
    }));
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((f) => f.id !== id),
    }));
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

    setFinanceData((prev) => {
      let nextTransactions = prev.transactions;
      if (shouldApplyNow) {
        const timeStr = now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const dateStr = now.toISOString().split('T')[0];

        const autoTx: Transaction = {
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
        nextTransactions = [autoTx, ...prev.transactions];
      }

      return {
        ...prev,
        transactions: nextTransactions,
        savingsGoals: [...prev.savingsGoals, created],
      };
    });
  };

  const handleContributeSavings = (goalId: string, amount: number) => {
    const targetGoal = financeData.savingsGoals.find((g) => g.id === goalId);
    const goalName = targetGoal ? targetGoal.name : 'Meta de Ahorro';

    setFinanceData((prev) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toISOString().split('T')[0];

      // Any contribution to savings is recorded as an expense transaction in MOVIMIENTOS,
      // which automatically deducts from real available capital!
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

      return {
        ...prev,
        transactions: [contributionTx, ...prev.transactions],
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === goalId ? { ...g, currentAmount: (g.currentAmount || 0) + amount } : g
        ),
      };
    });
  };

  const handleDeleteSavingsGoal = (goalId: string) => {
    setFinanceData((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId),
    }));
  };

  const handleUpdateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setFinanceData((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
    }));
  };

  const handleAmortizeDebt = (debtId: string, amount: number) => {
    const targetDebt = financeData.debts.find((d) => d.id === debtId);
    const debtName = targetDebt ? targetDebt.name : 'Deuda';

    // 1. Update debt amortized amount
    setFinanceData((prev) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toISOString().split('T')[0];

      // 2. Add amortization transaction to MOVIMIENTOS as "expense"
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
  };

  const handleUpdateProfile = (updatedProfile: NonNullable<FinanceData['userProfile']>) => {
    setFinanceData((prev) => ({
      ...prev,
      userProfile: updatedProfile,
    }));
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
  };

  const handleDeleteDebt = (debtId: string) => {
    setFinanceData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== debtId),
    }));
  };

  const handleUpdateDebt = (updatedDebt: DebtItem) => {
    setFinanceData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)),
    }));
  };

  const handleUpdatePin = (newPin: string) => {
    setFinanceData((prev) => ({
      ...prev,
      pinCode: newPin,
    }));
  };

  // Header Title based on active tab and subpage
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

  // If locked, render Secure PIN Lock Screen
  if (isLocked) {
    return (
      <LockScreen
        storedPin={financeData.pinCode}
        onUnlocked={() => setIsLocked(false)}
        onUpdatePin={handleUpdatePin}
        userAvatarUrl={financeData.userProfile?.avatarUrl}
      />
    );
  }

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
          if (tab === 'gestion' && managementSubpage === 'fijos') {
            // keep current subpage
          }
        }}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={
            financeData.userProfile || {
              name: 'Lucas Collazo',
              email: 'collazolucas@gmail.com',
              avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
              bio: 'Gestión patrimonial & finanzas personales',
            }
          }
          onSaveProfile={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
