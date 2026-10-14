import React, { useState, useMemo } from 'react';
import { FinanceData, FixedExpense, FixedIncome, SavingsGoal, DebtItem } from '../types/finance';
import { playKeypadTone, playSuccessChime, triggerHaptic, triggerConfetti } from '../utils/feedback';
import {
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  isItemActiveInMonth,
  formatApplicableMonths,
  getMonthStatusInfo,
} from '../utils/monthUtils';

export type ManagementSubpage = 'fijos' | 'ahorro' | 'deuda';

interface MonthSelectorFieldProps {
  label?: string;
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  accentColor: 'red' | 'green';
}

const MonthSelectorField: React.FC<MonthSelectorFieldProps> = ({
  label = 'Meses en los que se aplica',
  selectedMonths,
  onChange,
  accentColor,
}) => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const isAllSelected = selectedMonths.length === 12;

  const toggleMonth = (monthNum: number) => {
    if (selectedMonths.includes(monthNum)) {
      if (selectedMonths.length === 1) return; // Keep at least one
      onChange(selectedMonths.filter((m) => m !== monthNum));
    } else {
      onChange([...selectedMonths, monthNum].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onChange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const selectCurrentOnly = () => {
    onChange([currentMonth]);
  };

  const selectNextOnly = () => {
    onChange([nextMonth]);
  };

  const accentPillClass =
    accentColor === 'red'
      ? 'bg-[#ff7886] text-[#780021] font-bold shadow-sm'
      : 'bg-[#4edea3] text-[#003824] font-bold shadow-sm';

  const accentBorderClass =
    accentColor === 'red' ? 'border-[#ff7886]/30' : 'border-[#4edea3]/30';

  return (
    <div className={`p-3 rounded-xl bg-[#0b1326] border ${accentBorderClass} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#bbcabf]">
            calendar_month
          </span>
          {label}
        </label>
        <span className="text-[10px] font-num text-[#bbcabf]">
          {isAllSelected ? 'Todos los meses' : `${selectedMonths.length} de 12 meses`}
        </span>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={selectAll}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-sans font-semibold border transition-all ${
            isAllSelected
              ? 'bg-[#222a3d] text-white border-white/20'
              : 'bg-[#171f33] text-[#bbcabf] border-white/5 hover:text-white'
          }`}
        >
          Todos los meses
        </button>
        <button
          type="button"
          onClick={selectCurrentOnly}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-sans font-semibold border transition-all ${
            selectedMonths.length === 1 && selectedMonths[0] === currentMonth
              ? 'bg-[#222a3d] text-white border-white/20'
              : 'bg-[#171f33] text-[#bbcabf] border-white/5 hover:text-white'
          }`}
        >
          Solo {MONTH_NAMES_SHORT[currentMonth - 1]} ({MONTH_NAMES_FULL[currentMonth - 1]})
        </button>
        <button
          type="button"
          onClick={selectNextOnly}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-sans font-semibold border transition-all ${
            selectedMonths.length === 1 && selectedMonths[0] === nextMonth
              ? 'bg-[#222a3d] text-white border-white/20'
              : 'bg-[#171f33] text-[#bbcabf] border-white/5 hover:text-white'
          }`}
        >
          Solo {MONTH_NAMES_SHORT[nextMonth - 1]} ({MONTH_NAMES_FULL[nextMonth - 1]})
        </button>
      </div>

      {/* Grid 6x2 de Meses */}
      <div className="grid grid-cols-6 gap-1">
        {MONTH_NAMES_SHORT.map((name, index) => {
          const mNum = index + 1;
          const isSelected = selectedMonths.includes(mNum);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggleMonth(mNum)}
              className={`py-1.5 px-0.5 rounded-lg text-center font-num text-xs font-semibold transition-all ${
                isSelected
                  ? accentPillClass
                  : 'bg-[#171f33] text-[#86948a] hover:text-[#bbcabf] hover:bg-[#222a3d] border border-white/5'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Resumen explicativo */}
      <div className="text-[11px] text-[#bbcabf] leading-snug flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
          check_circle
        </span>
        <span>
          {isAllSelected
            ? 'Se contabilizará todos los meses de forma recurrente.'
            : selectedMonths.length === 1
            ? `Se contabilizará únicamente en ${MONTH_NAMES_FULL[selectedMonths[0] - 1]}. En el resto de meses no se aplicará.`
            : `Se contabilizará en los meses: ${selectedMonths.map((m) => MONTH_NAMES_SHORT[m - 1]).join(', ')}.`}
        </span>
      </div>
    </div>
  );
};

interface ManagementScreenProps {
  data: FinanceData;
  activeSubpage: ManagementSubpage;
  onSubpageChange: (subpage: ManagementSubpage) => void;
  onAddFixedExpense: (item: Omit<FixedExpense, 'id'>) => void;
  onUpdateFixedExpense?: (item: FixedExpense) => void;
  onDeleteFixedExpense?: (id: string) => void;
  onAddFixedIncome?: (item: Omit<FixedIncome, 'id'>) => void;
  onUpdateFixedIncome?: (item: FixedIncome) => void;
  onDeleteFixedIncome?: (id: string) => void;
  onAddSavingsGoal: (item: Omit<SavingsGoal, 'id'>, applyCurrentMonth?: boolean) => void;
  onContributeSavings: (goalId: string, amount: number) => void;
  onDeleteSavingsGoal?: (goalId: string) => void;
  onUpdateSavingsGoal?: (goal: SavingsGoal) => void;
  onAmortizeDebt: (debtId: string, amount: number) => void;
  onAddDebt: (debt: Omit<DebtItem, 'id'>) => void;
  onUpdateDebt?: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const ManagementScreen: React.FC<ManagementScreenProps> = ({
  data,
  activeSubpage,
  onSubpageChange,
  onAddFixedExpense,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
  onAddFixedIncome,
  onUpdateFixedIncome,
  onDeleteFixedIncome,
  onAddSavingsGoal,
  onContributeSavings,
  onDeleteSavingsGoal,
  onUpdateSavingsGoal,
  onAmortizeDebt,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
}) => {
  const { baseIncome, fixedExpenses, savingsGoals, debts } = data;
  const currency = '€';

  const [showFixedBreakdown, setShowFixedBreakdown] = useState<boolean>(true);

  // Current month key & name
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthName = useMemo(() => {
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return monthNames[new Date().getMonth()];
  }, []);

  // Modals state
  const [showNewGoalModal, setShowNewGoalModal] = useState<boolean>(false);
  const [showNewFixedModal, setShowNewFixedModal] = useState<boolean>(false);
  const [showNewDebtModal, setShowNewDebtModal] = useState<boolean>(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [customContributionAmount, setCustomContributionAmount] = useState<string>('300');
  const [amortizeDebtId, setAmortizeDebtId] = useState<string | null>(null);
  const [amortizeAmountInput, setAmortizeAmountInput] = useState<string>('250');

  // Month filter for viewing Fijos: 'all' or month number 1-12 (defaults to current calendar month)
  const currentCalendarMonth = new Date().getMonth() + 1;
  const [viewMonthFilter, setViewMonthFilter] = useState<number | 'all'>(currentCalendarMonth);

  // Fixed subpage sub-tab (Gastos Fijos vs Ingresos Fijos)
  const [fixedTab, setFixedTab] = useState<'gastos' | 'ingresos'>('gastos');

  // Edit fixed expense state
  const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
  const [editFixedName, setEditFixedName] = useState<string>('');
  const [editFixedAmount, setEditFixedAmount] = useState<string>('');
  const [editFixedDueDate, setEditFixedDueDate] = useState<string>('');
  const [editFixedMonths, setEditFixedMonths] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  // Fixed Incomes state
  const [showNewIncomeModal, setShowNewIncomeModal] = useState<boolean>(false);
  const [newIncomeName, setNewIncomeName] = useState<string>('');
  const [newIncomeAmount, setNewIncomeAmount] = useState<string>('');
  const [newIncomePeriodicity, setNewIncomePeriodicity] = useState<string>('Cobro mensual (Día 1)');
  const [newIncomeMonths, setNewIncomeMonths] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  const [editingFixedIncome, setEditingFixedIncome] = useState<FixedIncome | null>(null);
  const [editIncomeName, setEditIncomeName] = useState<string>('');
  const [editIncomeAmount, setEditIncomeAmount] = useState<string>('');
  const [editIncomePeriodicity, setEditIncomePeriodicity] = useState<string>('');
  const [editIncomeMonths, setEditIncomeMonths] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  // Edit goal state
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editGoalName, setEditGoalName] = useState<string>('');
  const [editGoalTarget, setEditGoalTarget] = useState<string>('');
  const [editGoalMonthly, setEditGoalMonthly] = useState<string>('');

  // New goal form state
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');
  const [newGoalInitial, setNewGoalInitial] = useState<string>('');
  const [newGoalMonthly, setNewGoalMonthly] = useState<string>('');
  const [applyFirstContributionNow, setApplyFirstContributionNow] = useState<boolean>(true);
  const [newGoalTag, setNewGoalTag] = useState<string>('PATRIMONIO');
  const [newGoalDate, setNewGoalDate] = useState<string>('');

  // New fixed form state
  const [newFixedName, setNewFixedName] = useState<string>('');
  const [newFixedAmount, setNewFixedAmount] = useState<string>('');
  const [newFixedDueDate, setNewFixedDueDate] = useState<string>('Vencimiento día 5');
  const [newFixedMonths, setNewFixedMonths] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);

  // New debt form state
  const [newDebtName, setNewDebtName] = useState<string>('');
  const [newDebtInitial, setNewDebtInitial] = useState<string>('');
  const [newDebtAmortized, setNewDebtAmortized] = useState<string>('');
  const [newDebtInterest, setNewDebtInterest] = useState<string>('');
  const [newDebtPriority, setNewDebtPriority] = useState<string>('');
  const [newDebtEndDate, setNewDebtEndDate] = useState<string>('');

  // Edit debt state (Modificar deuda: acumulado amortizado, total a amortizar, etc.)
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [editDebtName, setEditDebtName] = useState<string>('');
  const [editDebtInitialAmount, setEditDebtInitialAmount] = useState<string>('');
  const [editDebtAmortizedAmount, setEditDebtAmortizedAmount] = useState<string>('');
  const [editDebtInterestRate, setEditDebtInterestRate] = useState<string>('');
  const [editDebtPriority, setEditDebtPriority] = useState<string>('1');
  const [editDebtEndDate, setEditDebtEndDate] = useState<string>('');
  const [editDebtIcon, setEditDebtIcon] = useState<string>('trending_down');

  // Fixed Incomes array
  const fixedIncomes = data.fixedIncomes || [];

  // Active items for the selected month filter
  const activeFixedExpensesThisMonth = useMemo(() => {
    if (viewMonthFilter === 'all') return fixedExpenses;
    return fixedExpenses.filter((fix) => isItemActiveInMonth(fix.applicableMonths, viewMonthFilter));
  }, [fixedExpenses, viewMonthFilter]);

  const activeFixedIncomesThisMonth = useMemo(() => {
    if (viewMonthFilter === 'all') return fixedIncomes;
    return fixedIncomes.filter((inc) => isItemActiveInMonth(inc.applicableMonths, viewMonthFilter));
  }, [fixedIncomes, viewMonthFilter]);

  // Calculations for Fixed section
  const totalFixedIncome = useMemo(() => {
    if (viewMonthFilter === 'all') {
      if (fixedIncomes.length > 0) {
        return fixedIncomes.reduce((sum, item) => sum + item.amount, 0);
      }
      return baseIncome;
    }
    if (fixedIncomes.length > 0) {
      return activeFixedIncomesThisMonth.reduce((sum, item) => sum + item.amount, 0);
    }
    return baseIncome;
  }, [fixedIncomes, activeFixedIncomesThisMonth, baseIncome, viewMonthFilter]);

  const totalFixed = useMemo(() => {
    if (viewMonthFilter === 'all') {
      return fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    }
    return activeFixedExpensesThisMonth.reduce((sum, item) => sum + item.amount, 0);
  }, [fixedExpenses, activeFixedExpensesThisMonth, viewMonthFilter]);

  const netFixedMargin = totalFixedIncome - totalFixed;

  const totalMovementsExpenses = useMemo(() => {
    return (data.transactions || [])
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions]);

  const totalMovementsIncome = useMemo(() => {
    return (data.transactions || [])
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions]);

  // Margen libre neto integrando ingresos fijos y gastos e ingresos de movimientos
  const freeMargin = totalFixedIncome + totalMovementsIncome - totalFixed - totalMovementsExpenses;
  const effectiveIncome = Math.max(1, totalFixedIncome + totalMovementsIncome);
  const fixedPercent = Math.min(100, Math.round((totalFixed / effectiveIncome) * 100));
  const freeMarginPercent = Math.max(0, 100 - fixedPercent);

  // Calculations for Savings section
  const totalSaved = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [savingsGoals]);

  const totalSavingsTarget = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  }, [savingsGoals]);

  const overallSavingsProgress = Math.min(
    100,
    Math.round((totalSaved / (totalSavingsTarget || 1)) * 100)
  );

  // Calculations for Debt section
  const totalDebtInitial = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.initialAmount, 0);
  }, [debts]);

  const totalDebtAmortized = useMemo(() => {
    return debts.reduce((sum, d) => sum + (d.amortizedAmount || 0), 0);
  }, [debts]);

  const totalRemainingDebt = Math.max(0, totalDebtInitial - totalDebtAmortized);
  const totalDebtProgress = Math.min(
    100,
    Math.round((totalDebtAmortized / (totalDebtInitial || 1)) * 100)
  );

  const switchSubpage = (subpage: ManagementSubpage) => {
    playKeypadTone(560, 15);
    triggerHaptic(8);
    onSubpageChange(subpage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const parsedTarget = newGoalTarget ? parseFloat(newGoalTarget) : undefined;
    const parsedInitial = newGoalInitial ? parseFloat(newGoalInitial) : undefined;
    const parsedMonthly = newGoalMonthly ? parseFloat(newGoalMonthly) : undefined;

    onAddSavingsGoal(
      {
        name: newGoalName.trim(),
        tag: newGoalTag || 'AHORRO',
        targetAmount: parsedTarget,
        currentAmount: parsedInitial || 0,
        monthlyContribution: parsedMonthly,
        targetDateStr: newGoalDate.trim() || undefined,
        icon: 'savings',
      },
      applyFirstContributionNow
    );

    playSuccessChime();
    triggerHaptic(20);
    triggerConfetti();
    setShowNewGoalModal(false);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalInitial('');
    setNewGoalMonthly('');
    setNewGoalDate('');
    setApplyFirstContributionNow(true);
  };

  const handleStartEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setEditGoalName(goal.name);
    setEditGoalTarget(goal.targetAmount ? goal.targetAmount.toString() : '');
    setEditGoalMonthly(goal.monthlyContribution ? goal.monthlyContribution.toString() : '');
  };

  const handleSaveEditedGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !onUpdateSavingsGoal) return;
    const parsedTarget = editGoalTarget ? parseFloat(editGoalTarget) : undefined;
    const parsedMonthly = editGoalMonthly ? parseFloat(editGoalMonthly) : undefined;

    onUpdateSavingsGoal({
      ...editingGoal,
      name: editGoalName.trim() || editingGoal.name,
      targetAmount: parsedTarget,
      monthlyContribution: parsedMonthly,
    });

    playSuccessChime();
    triggerHaptic(15);
    setEditingGoal(null);
  };

  const handleCreateFixed = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newFixedAmount);
    if (!newFixedName || isNaN(amount) || amount <= 0) return;

    onAddFixedExpense({
      name: newFixedName,
      amount,
      category: 'Gasto Fijo',
      dueDateNote: newFixedDueDate || 'Vencimiento mensual',
      icon: 'receipt_long',
      applicableMonths: newFixedMonths,
    });

    playSuccessChime();
    triggerHaptic(20);
    setShowNewFixedModal(false);
    setNewFixedName('');
    setNewFixedAmount('');
    setNewFixedDueDate('Vencimiento día 5');
    setNewFixedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleStartEditFixedExpense = (fix: FixedExpense) => {
    setEditingFixedExpense(fix);
    setEditFixedName(fix.name);
    setEditFixedAmount(fix.amount.toString());
    setEditFixedDueDate(fix.dueDateNote || '');
    setEditFixedMonths(
      fix.applicableMonths && fix.applicableMonths.length > 0
        ? fix.applicableMonths
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
  };

  const handleSaveEditFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixedExpense || !onUpdateFixedExpense) return;
    const amount = parseFloat(editFixedAmount);
    if (!editFixedName.trim() || isNaN(amount) || amount <= 0) return;

    onUpdateFixedExpense({
      ...editingFixedExpense,
      name: editFixedName.trim(),
      amount,
      dueDateNote: editFixedDueDate.trim() || 'Vencimiento mensual',
      applicableMonths: editFixedMonths,
    });

    playSuccessChime();
    triggerHaptic(15);
    setEditingFixedExpense(null);
  };

  const handleDeleteFixedExpenseItem = (id: string) => {
    if (onDeleteFixedExpense) {
      onDeleteFixedExpense(id);
      triggerHaptic(15);
      playSuccessChime();
    }
  };

  const handleCreateFixedIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newIncomeAmount);
    if (!newIncomeName.trim() || isNaN(amount) || amount <= 0) return;

    if (onAddFixedIncome) {
      onAddFixedIncome({
        name: newIncomeName.trim(),
        amount,
        category: 'Ingreso Fijo',
        periodicityNote: newIncomePeriodicity.trim() || 'Cobro mensual (Día 1)',
        icon: 'payments',
        applicableMonths: newIncomeMonths,
      });
    }

    playSuccessChime();
    triggerHaptic(20);
    setShowNewIncomeModal(false);
    setNewIncomeName('');
    setNewIncomeAmount('');
    setNewIncomePeriodicity('Cobro mensual (Día 1)');
    setNewIncomeMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleStartEditFixedIncome = (inc: FixedIncome) => {
    setEditingFixedIncome(inc);
    setEditIncomeName(inc.name);
    setEditIncomeAmount(inc.amount.toString());
    setEditIncomePeriodicity(inc.periodicityNote || '');
    setEditIncomeMonths(
      inc.applicableMonths && inc.applicableMonths.length > 0
        ? inc.applicableMonths
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
  };

  const handleSaveEditFixedIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixedIncome || !onUpdateFixedIncome) return;
    const amount = parseFloat(editIncomeAmount);
    if (!editIncomeName.trim() || isNaN(amount) || amount <= 0) return;

    onUpdateFixedIncome({
      ...editingFixedIncome,
      name: editIncomeName.trim(),
      amount,
      periodicityNote: editIncomePeriodicity.trim() || 'Cobro mensual',
      applicableMonths: editIncomeMonths,
    });

    playSuccessChime();
    triggerHaptic(15);
    setEditingFixedIncome(null);
  };

  const handleDeleteFixedIncomeItem = (id: string) => {
    if (onDeleteFixedIncome) {
      onDeleteFixedIncome(id);
      triggerHaptic(15);
      playSuccessChime();
    }
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const initial = parseFloat(newDebtInitial);
    if (!newDebtName.trim() || isNaN(initial) || initial <= 0) return;

    const parsedAmortized = newDebtAmortized ? parseFloat(newDebtAmortized) : undefined;
    const parsedInterest = newDebtInterest ? parseFloat(newDebtInterest) : undefined;
    const parsedPriority = newDebtPriority ? parseInt(newDebtPriority, 10) : undefined;

    onAddDebt({
      name: newDebtName.trim(),
      initialAmount: initial,
      amortizedAmount: parsedAmortized || 0,
      interestRate: parsedInterest,
      priority: parsedPriority,
      estimatedEndDate: newDebtEndDate.trim() || undefined,
      icon: 'trending_down',
    });

    playSuccessChime();
    triggerHaptic(20);
    setShowNewDebtModal(false);
    setNewDebtName('');
    setNewDebtInitial('');
    setNewDebtAmortized('');
    setNewDebtInterest('');
    setNewDebtPriority('');
    setNewDebtEndDate('');
  };

  const handleStartEditDebt = (debt: DebtItem) => {
    setEditingDebt(debt);
    setEditDebtName(debt.name);
    setEditDebtInitialAmount(debt.initialAmount.toString());
    setEditDebtAmortizedAmount((debt.amortizedAmount || 0).toString());
    setEditDebtInterestRate(debt.interestRate !== undefined ? debt.interestRate.toString() : '');
    setEditDebtPriority(debt.priority !== undefined ? debt.priority.toString() : '1');
    setEditDebtEndDate(debt.estimatedEndDate || '');
    setEditDebtIcon(debt.icon || 'trending_down');
    playKeypadTone(540, 15);
  };

  const handleSaveEditDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;
    const initial = parseFloat(editDebtInitialAmount);
    const amortized = parseFloat(editDebtAmortizedAmount);
    if (!editDebtName.trim() || isNaN(initial) || initial <= 0) return;

    const parsedAmortized = isNaN(amortized) ? 0 : Math.max(0, amortized);
    const parsedInterest = editDebtInterestRate ? parseFloat(editDebtInterestRate) : undefined;
    const parsedPriority = editDebtPriority ? parseInt(editDebtPriority, 10) : undefined;

    const updated: DebtItem = {
      ...editingDebt,
      name: editDebtName.trim(),
      initialAmount: initial,
      amortizedAmount: parsedAmortized,
      interestRate: !isNaN(parsedInterest as number) ? parsedInterest : undefined,
      priority: !isNaN(parsedPriority as number) ? parsedPriority : undefined,
      estimatedEndDate: editDebtEndDate.trim() || undefined,
      icon: editDebtIcon || 'trending_down',
    };

    if (onUpdateDebt) {
      onUpdateDebt(updated);
    }
    setEditingDebt(null);
    playSuccessChime();
    triggerHaptic(20);
  };

  const handleQuickContribute = () => {
    if (!contributeGoalId) return;
    const amount = parseFloat(customContributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    onContributeSavings(contributeGoalId, amount);
    playSuccessChime();
    triggerHaptic(25);
    triggerConfetti();
    setContributeGoalId(null);
  };

  const handleQuickAmortize = () => {
    if (!amortizeDebtId) return;
    const amount = parseFloat(amortizeAmountInput);
    if (isNaN(amount) || amount <= 0) return;

    onAmortizeDebt(amortizeDebtId, amount);
    playSuccessChime();
    triggerHaptic(25);
    triggerConfetti();
    setAmortizeDebtId(null);
  };

  return (
    <div className="w-full flex flex-col gap-5 max-w-lg mx-auto pb-12">
      {/* Subpage Navigation Selector */}
      <div className="flex items-center justify-between p-1 bg-[#131b2e] rounded-2xl border border-white/5 sticky top-16 z-40 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => switchSubpage('fijos')}
          className={`flex-1 py-2.5 px-2 text-center rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubpage === 'fijos'
              ? 'bg-[#222a3d] text-[#4edea3] shadow-md border border-white/10 scale-[1.02]'
              : 'text-[#bbcabf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">pie_chart</span>
          <span>Fijos</span>
        </button>
        <button
          type="button"
          onClick={() => switchSubpage('ahorro')}
          className={`flex-1 py-2.5 px-2 text-center rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubpage === 'ahorro'
              ? 'bg-[#222a3d] text-[#4edea3] shadow-md border border-white/10 scale-[1.02]'
              : 'text-[#bbcabf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">savings</span>
          <span>Ahorro</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-0.5" />
        </button>
        <button
          type="button"
          onClick={() => switchSubpage('deuda')}
          className={`flex-1 py-2.5 px-2 text-center rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubpage === 'deuda'
              ? 'bg-[#222a3d] text-[#4edea3] shadow-md border border-white/10 scale-[1.02]'
              : 'text-[#bbcabf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">trending_down</span>
          <span>Deuda</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff7886] ml-0.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBPÁGINA 1: COMPROMISOS E INGRESOS FIJOS */}
      {/* ========================================================================= */}
      {activeSubpage === 'fijos' && (
        <section className="flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[22px]">tune</span>
              <h2 className="font-sans text-lg font-bold text-white tracking-tight">
                Compromisos e Ingresos Fijos
              </h2>
            </div>
            <span className="font-num text-[10px] uppercase px-2.5 py-1 rounded-full bg-[#171f33] text-[#4edea3] font-bold tracking-wider border border-[#4edea3]/20">
              Persisten Mes a Mes
            </span>
          </div>

          {/* Selector de Mes para Visualización y Comprobación */}
          <div className="flex flex-col gap-2 p-3 bg-[#131b2e] rounded-2xl border border-white/5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
                  calendar_month
                </span>
                <span className="font-sans text-xs font-semibold text-white">
                  Visualizar impacto en:
                </span>
                <span className="font-num text-xs font-bold text-[#4edea3]">
                  {viewMonthFilter === 'all'
                    ? 'Todo el año'
                    : `${MONTH_NAMES_FULL[viewMonthFilter - 1]} ${
                        viewMonthFilter === currentCalendarMonth ? '(Mes actual)' : ''
                      }`}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setViewMonthFilter(viewMonthFilter === 'all' ? currentCalendarMonth : 'all')
                }
                className="text-[11px] text-[#bbcabf] hover:text-white px-2 py-0.5 rounded-lg bg-[#222a3d] border border-white/5 transition-colors"
              >
                {viewMonthFilter === 'all' ? 'Ver mes actual' : 'Ver todo el año'}
              </button>
            </div>

            {/* Carrusel horizontal de Meses */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setViewMonthFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-sans font-bold shrink-0 transition-all ${
                  viewMonthFilter === 'all'
                    ? 'bg-[#4edea3] text-[#003824] shadow'
                    : 'bg-[#171f33] text-[#bbcabf] hover:text-white border border-white/5'
                }`}
              >
                Todo el año
              </button>
              {MONTH_NAMES_SHORT.map((shortName, idx) => {
                const mNum = idx + 1;
                const isSelected = viewMonthFilter === mNum;
                const isCurrent = mNum === currentCalendarMonth;
                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => setViewMonthFilter(mNum)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-num font-bold shrink-0 transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#4edea3] text-[#003824] shadow'
                        : isCurrent
                        ? 'bg-[#222a3d] text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#171f33] text-[#bbcabf] hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{shortName}</span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Metric Bento Card */}
          <div className="bg-[#131b2e] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#10b981]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Metric Dual Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 relative z-10">
              <div className="flex flex-col p-3 rounded-xl bg-[#222a3d]/70 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                  <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                    Ingresos Fijos {viewMonthFilter !== 'all' ? `(${MONTH_NAMES_SHORT[viewMonthFilter - 1]})` : ''}
                  </span>
                </div>
                <span className="font-num text-xl sm:text-2xl text-[#4edea3] font-bold">
                  +{currency}
                  {totalFixedIncome.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                </span>
                <span className="font-sans text-[11px] text-[#bbcabf] mt-0.5">
                  {viewMonthFilter !== 'all'
                    ? `${activeFixedIncomesThisMonth.length} de ${fixedIncomes.length} partidas activas`
                    : `${fixedIncomes.length} partidas fijas`}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-xl bg-[#222a3d]/70 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#ffb2b7]" />
                  <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                    Gastos Fijos {viewMonthFilter !== 'all' ? `(${MONTH_NAMES_SHORT[viewMonthFilter - 1]})` : ''}
                  </span>
                </div>
                <span className="font-num text-xl sm:text-2xl text-[#ffb2b7] font-bold">
                  -{currency}
                  {totalFixed.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                </span>
                <span className="font-sans text-[11px] text-[#bbcabf] mt-0.5">
                  {viewMonthFilter !== 'all'
                    ? `${activeFixedExpensesThisMonth.length} de ${fixedExpenses.length} partidas activas`
                    : `${fixedExpenses.length} partidas fijas`}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col p-3 rounded-xl bg-[#222a3d]/70 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#c0c1ff]" />
                  <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                    Margen Neto Fijo
                  </span>
                </div>
                <span className={`font-num text-xl sm:text-2xl font-bold ${netFixedMargin >= 0 ? 'text-white' : 'text-[#ffb2b7]'}`}>
                  {netFixedMargin >= 0 ? '+' : ''}{currency}
                  {netFixedMargin.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                </span>
                <span className="font-sans text-[11px] text-[#bbcabf] mt-0.5">
                  {viewMonthFilter !== 'all'
                    ? `En ${MONTH_NAMES_FULL[viewMonthFilter - 1]}`
                    : 'Antes de variables'}
                </span>
              </div>
            </div>

            {/* Informative Note */}
            <div className="relative z-10 p-2.5 rounded-xl bg-[#171f33] border border-white/5 flex items-center gap-2 text-xs text-[#bbcabf]">
              <span className="material-symbols-outlined text-[#4edea3] text-[18px] shrink-0">
                event_repeat
              </span>
              <p className="leading-snug">
                Los gastos e ingresos fijos aplican en los meses configurados. Puedes seleccionar en qué mes o meses se activan y editarlos cuando lo necesites.
              </p>
            </div>

            {/* Structural Ratio Bar */}
            <div className="flex flex-col gap-2 relative z-10 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-[#bbcabf]">Compromiso sobre Ingresos Fijos</span>
                <span className="font-num text-white font-bold">
                  {Math.min(100, Math.round((totalFixed / (totalFixedIncome || 1)) * 100))}% del ingreso comprometido
                </span>
              </div>

              {/* Segmented Proportion Bar */}
              <div className="w-full h-3 bg-[#2d3449] rounded-full overflow-hidden flex p-0.5 gap-0.5">
                <div
                  className="h-full bg-[#ff7886] rounded-l-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((totalFixed / (totalFixedIncome || 1)) * 100))}%` }}
                  title={`Gastos Fijos`}
                />
                <div
                  className="h-full bg-[#4edea3] rounded-r-full transition-all duration-700"
                  style={{ width: `${Math.max(0, 100 - Math.min(100, Math.round((totalFixed / (totalFixedIncome || 1)) * 100)))}%` }}
                  title={`Margen Fijo Libre`}
                />
              </div>
            </div>
          </div>

          {/* Sub-selector Segmented Pills: Gastos Fijos vs Ingresos Fijos */}
          <div className="flex items-center p-1 bg-[#131b2e] rounded-xl gap-1 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setFixedTab('gastos');
                playKeypadTone(520, 15);
              }}
              className={`flex-1 py-2 px-3 text-center rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                fixedTab === 'gastos'
                  ? 'bg-[#222a3d] text-[#ffb2b7] shadow border border-white/10'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              <span>Gastos Fijos ({fixedExpenses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFixedTab('ingresos');
                playKeypadTone(620, 15);
              }}
              className={`flex-1 py-2 px-3 text-center rounded-lg font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                fixedTab === 'ingresos'
                  ? 'bg-[#222a3d] text-[#4edea3] shadow border border-white/10'
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>Ingresos Fijos ({fixedIncomes.length})</span>
            </button>
          </div>

          {/* LISTA DE GASTOS FIJOS */}
          {fixedTab === 'gastos' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-sans text-xs text-[#bbcabf] font-semibold">
                  Partidas de Gasto Recurrente
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewFixedModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#ff7886]/15 hover:bg-[#ff7886]/25 text-[#ffb2b7] border border-[#ff7886]/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Añadir Gasto Fijo</span>
                </button>
              </div>

              {fixedExpenses.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#131b2e] text-center text-[#bbcabf] border border-white/5">
                  <span className="material-symbols-outlined text-[32px] text-[#86948a] mb-2">receipt</span>
                  <p className="text-sm">No tienes gastos fijos registrados.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {fixedExpenses.map((fix) => {
                    const ratio = Math.round((fix.amount / (totalFixed || 1)) * 100);
                    const isActiveInView =
                      viewMonthFilter === 'all'
                        ? true
                        : isItemActiveInMonth(fix.applicableMonths, viewMonthFilter);
                    const monthsLabel = formatApplicableMonths(fix.applicableMonths);

                    return (
                      <div
                        key={fix.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl bg-[#131b2e] border transition-all group ${
                          isActiveInView
                            ? 'border-white/5 hover:bg-[#171f33]'
                            : 'border-dashed border-white/10 opacity-70 bg-[#101726]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
                              isActiveInView
                                ? 'bg-[#222a3d] text-[#ffb2b7]'
                                : 'bg-[#1b2233] text-[#86948a]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {fix.icon || 'receipt'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-sm font-semibold text-white truncate">
                              {fix.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="font-num text-[11px] text-[#bbcabf]">
                                {fix.dueDateNote}
                              </span>

                              {/* Badge de Meses */}
                              <span className="font-num text-[10px] text-[#bbcabf] bg-[#222a3d] px-2 py-0.5 rounded-md border border-white/5 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">
                                  calendar_month
                                </span>
                                {monthsLabel}
                              </span>

                              {/* Indicador de si aplica o no en el mes visualizado */}
                              {viewMonthFilter !== 'all' && (
                                <span
                                  className={`font-num text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                                    isActiveInView
                                      ? 'text-[#4edea3] bg-[#4edea3]/10'
                                      : 'text-[#ffb2b7] bg-[#ff7886]/10'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">
                                    {isActiveInView ? 'check' : 'schedule'}
                                  </span>
                                  {isActiveInView
                                    ? `Aplica en ${MONTH_NAMES_SHORT[viewMonthFilter - 1]}`
                                    : `No aplica en ${MONTH_NAMES_SHORT[viewMonthFilter - 1]}`}
                                </span>
                              )}

                              {isActiveInView && (
                                <span className="font-num text-[10px] text-[#ffb2b7] bg-[#ff7886]/10 px-1.5 py-0.2 rounded font-semibold">
                                  {ratio}% del fijo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-num text-sm font-bold ${
                              isActiveInView ? 'text-white' : 'text-[#86948a] line-through'
                            }`}
                          >
                            {currency}
                            {fix.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditFixedExpense(fix)}
                              className="p-1.5 rounded-lg text-[#bbcabf] hover:text-white hover:bg-[#222a3d] transition-colors"
                              title="Modificar manualmente"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFixedExpenseItem(fix.id)}
                              className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#ff7886] hover:bg-[#222a3d] transition-colors"
                              title="Eliminar gasto fijo"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LISTA DE INGRESOS FIJOS */}
          {fixedTab === 'ingresos' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-sans text-xs text-[#bbcabf] font-semibold">
                  Partidas de Ingreso Recurrente
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewIncomeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border border-[#4edea3]/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Añadir Ingreso Fijo</span>
                </button>
              </div>

              {fixedIncomes.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#131b2e] text-center text-[#bbcabf] border border-white/5">
                  <span className="material-symbols-outlined text-[32px] text-[#86948a] mb-2">payments</span>
                  <p className="text-sm">No tienes ingresos fijos registrados.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {fixedIncomes.map((inc) => {
                    const ratio = Math.round((inc.amount / (totalFixedIncome || 1)) * 100);
                    const isActiveInView =
                      viewMonthFilter === 'all'
                        ? true
                        : isItemActiveInMonth(inc.applicableMonths, viewMonthFilter);
                    const monthsLabel = formatApplicableMonths(inc.applicableMonths);

                    return (
                      <div
                        key={inc.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl bg-[#131b2e] border transition-all group ${
                          isActiveInView
                            ? 'border-white/5 hover:bg-[#171f33]'
                            : 'border-dashed border-white/10 opacity-70 bg-[#101726]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
                              isActiveInView
                                ? 'bg-[#222a3d] text-[#4edea3]'
                                : 'bg-[#1b2233] text-[#86948a]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {inc.icon || 'payments'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-sm font-semibold text-white truncate">
                              {inc.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="font-num text-[11px] text-[#bbcabf]">
                                {inc.periodicityNote || 'Cobro mensual'}
                              </span>

                              {/* Badge de Meses */}
                              <span className="font-num text-[10px] text-[#bbcabf] bg-[#222a3d] px-2 py-0.5 rounded-md border border-white/5 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">
                                  calendar_month
                                </span>
                                {monthsLabel}
                              </span>

                              {/* Indicador de si aplica o no en el mes visualizado */}
                              {viewMonthFilter !== 'all' && (
                                <span
                                  className={`font-num text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                                    isActiveInView
                                      ? 'text-[#4edea3] bg-[#4edea3]/10'
                                      : 'text-[#ffb2b7] bg-[#ff7886]/10'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">
                                    {isActiveInView ? 'check' : 'schedule'}
                                  </span>
                                  {isActiveInView
                                    ? `Aplica en ${MONTH_NAMES_SHORT[viewMonthFilter - 1]}`
                                    : `No aplica en ${MONTH_NAMES_SHORT[viewMonthFilter - 1]}`}
                                </span>
                              )}

                              {isActiveInView && (
                                <span className="font-num text-[10px] text-[#4edea3] bg-[#4edea3]/10 px-1.5 py-0.2 rounded font-semibold">
                                  {ratio}% del ingreso
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-num text-sm font-bold ${
                              isActiveInView ? 'text-[#4edea3]' : 'text-[#86948a] line-through'
                            }`}
                          >
                            +{currency}
                            {inc.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditFixedIncome(inc)}
                              className="p-1.5 rounded-lg text-[#bbcabf] hover:text-white hover:bg-[#222a3d] transition-colors"
                              title="Modificar manualmente"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFixedIncomeItem(inc.id)}
                              className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#ff7886] hover:bg-[#222a3d] transition-colors"
                              title="Eliminar ingreso fijo"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUBPÁGINA 2: METAS DE AHORRO */}
      {/* ========================================================================= */}
      {activeSubpage === 'ahorro' && (
        <section className="flex flex-col gap-4 animate-fadeIn">
          {/* Subpage Header with Back to Fijos */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => switchSubpage('fijos')}
              className="flex items-center gap-1.5 text-xs text-[#bbcabf] hover:text-[#4edea3] font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver a Fijos</span>
            </button>
            <span className="px-2.5 py-0.5 font-num text-[10px] text-[#4edea3] bg-[#4edea3]/10 rounded-full font-bold border border-[#4edea3]/20">
              {savingsGoals.length} Cuentas Activas
            </span>
          </div>

          {/* Subpage Title banner */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[24px]">
                military_tech
              </span>
              <div>
                <h2 className="font-sans text-xl font-bold text-white tracking-tight">
                  Metas de Ahorro
                </h2>
              </div>
            </div>
          </div>

          {/* Global Savings Stats Card */}
          <div className="bg-[#131b2e] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Ahorro Total Acumulado
                </span>
                <span className="font-num text-3xl text-[#4edea3] font-bold">
                  {currency}
                  {totalSaved.toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Meta Conjunta
                </span>
                <span className="font-num text-sm text-[#dae2fd] font-semibold">
                  {currency}
                  {totalSavingsTarget.toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* Progress line */}
            <div className="w-full h-2.5 bg-[#222a3d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4edea3] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(78,222,163,0.5)]"
                style={{ width: `${overallSavingsProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-num text-[#bbcabf]">
              <span className="text-[#4edea3] font-bold">{overallSavingsProgress}% alcanzado</span>
              <span>
                Faltan {currency}
                {(totalSavingsTarget - totalSaved).toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* Action Button: Crear Cuenta con halo esmeralda */}
          <button
            type="button"
            onClick={() => setShowNewGoalModal(true)}
            className="w-full h-13 rounded-2xl bg-[#131b2e] hover:bg-[#171f33] text-[#4edea3] font-sans text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(78,222,163,0.12)] border border-[#4edea3]/30 active:scale-[0.99] transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3]">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </div>
            <span>Crear Cuenta de Ahorro</span>
          </button>

          {/* Goals List */}
          <div className="flex flex-col gap-3">
            {savingsGoals.map((goal) => {
              const current = goal.currentAmount || 0;
              const hasTarget = goal.targetAmount !== undefined && goal.targetAmount > 0;
              const hasDate = Boolean(goal.targetDateStr && goal.targetDateStr.trim());
              const hasMonthly = Boolean(goal.monthlyContribution && goal.monthlyContribution > 0);

              const progress = hasTarget
                ? Math.min(100, Math.round((current / (goal.targetAmount || 1)) * 100))
                : 100;
              const remaining = hasTarget ? Math.max(0, (goal.targetAmount || 0) - current) : 0;
              const monthsLeft =
                hasTarget && hasMonthly && goal.monthlyContribution! > 0
                  ? Math.ceil(remaining / goal.monthlyContribution!)
                  : null;

              // Determinar si debemos mostrar meta estimada (solo si tiene meta o fecha)
              const showEstimatedGoalMeta = hasTarget || hasDate;

              return (
                <div
                  key={goal.id}
                  className="bg-[#131b2e] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {goal.imageUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-[#222a3d] flex-shrink-0 border border-white/10">
                          <img
                            src={goal.imageUrl}
                            alt={goal.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#222a3d] flex items-center justify-center text-[#4edea3] flex-shrink-0 border border-white/10 shadow-inner">
                          <span className="material-symbols-outlined text-[26px]">
                            {goal.icon || 'shield'}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="font-sans text-base font-bold text-white">{goal.name}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-num text-[9px] uppercase font-bold">
                            {goal.tag}
                          </span>
                        </div>
                        {hasMonthly ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
                              autorenew
                            </span>
                            <span className="font-sans text-xs text-[#4edea3] font-semibold">
                              Aporte automático: {currency}
                              {goal.monthlyContribution} / mes
                            </span>
                          </div>
                        ) : (
                          <p className="font-sans text-xs text-[#bbcabf] flex items-center gap-1 mt-0.5">
                            Cuenta de acumulación
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monthly automated contribution status pill if active */}
                  {hasMonthly && (
                    <div className="flex items-center justify-between text-[11px] bg-[#222a3d]/50 px-2.5 py-1.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-1.5 text-[#bbcabf]">
                        <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
                          bolt
                        </span>
                        <span>
                          Débito automático mensual:{' '}
                          <strong className="text-white font-num font-semibold">
                            {currency}{goal.monthlyContribution}
                          </strong>
                        </span>
                      </div>
                      <span className="font-num text-[10px] px-2 py-0.5 rounded-full bg-[#131b2e] text-[#4edea3] font-bold border border-[#4edea3]/20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                        {goal.lastContributionMonth === currentMonthKey
                          ? 'Aplicado este mes'
                          : 'Activo'}
                      </span>
                    </div>
                  )}

                  {/* Numbers */}
                  <div className="flex justify-between items-baseline pt-1">
                    <div className="flex flex-col">
                      <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                        Acumulado Actual
                      </span>
                      <span className="font-num text-2xl text-[#4edea3] font-bold">
                        {currency}
                        {current.toLocaleString('es-ES')}
                      </span>
                    </div>
                    {hasTarget && (
                      <div className="flex flex-col text-right">
                        <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                          Objetivo
                        </span>
                        <span className="font-num text-sm text-[#dae2fd] font-semibold">
                          {currency}
                          {goal.targetAmount!.toLocaleString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Shimmer progress bar (solo si tiene objetivo o barra con estado) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="w-full h-2.5 bg-[#222a3d] rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-[#4edea3] rounded-full relative transition-all duration-1000 shadow-[0_0_10px_rgba(78,222,163,0.5)]"
                        style={{ width: `${hasTarget ? progress : 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-num text-[11px] text-[#bbcabf]">
                      {hasTarget ? (
                        <span className="text-[#4edea3] font-bold">{progress}% completado</span>
                      ) : (
                        <span className="text-[#4edea3] font-bold">Fondo activo</span>
                      )}

                      {/* Solo mostrar meta estimada si tiene objetivo o fecha */}
                      {showEstimatedGoalMeta && monthsLeft !== null && monthsLeft > 0 && (
                        <span className="flex items-center gap-1 text-white">
                          <span className="material-symbols-outlined text-[13px] text-[#4edea3]">
                            hourglass_bottom
                          </span>
                          Meta estimada: ~{monthsLeft} meses restantes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action button */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    {hasDate ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#bbcabf]">
                        <span className="material-symbols-outlined text-[15px] text-[#4edea3]">
                          check_circle
                        </span>
                        <span>Fecha límite: {goal.targetDateStr}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#86948a]">Sin fecha límite</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {onUpdateSavingsGoal && (
                        <button
                          type="button"
                          onClick={() => handleStartEditGoal(goal)}
                          className="w-7 h-7 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[#bbcabf] hover:text-white flex items-center justify-center transition-colors border border-white/5"
                          title="Ajustar aporte mensual u objetivo"
                        >
                          <span className="material-symbols-outlined text-[15px]">tune</span>
                        </button>
                      )}
                      {onDeleteSavingsGoal && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSavingsGoal(goal.id);
                            triggerHaptic(20);
                            playKeypadTone(350, 30);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#222a3d] hover:bg-[#ff7886]/20 text-[#86948a] hover:text-[#ff7886] flex items-center justify-center transition-colors border border-white/5"
                          title="Eliminar Cuenta"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setContributeGoalId(goal.id);
                          setCustomContributionAmount(
                            goal.monthlyContribution ? goal.monthlyContribution.toString() : '100'
                          );
                        }}
                        className="py-1.5 px-3 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-white font-sans text-xs font-bold transition-all active:scale-95 border border-white/5 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#4edea3]">add</span>
                        Aportar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SUBPÁGINA 3: DEUDA Y AMORTIZACIÓN (Limpia según las capturas del usuario) */}
      {/* ========================================================================= */}
      {activeSubpage === 'deuda' && (
        <section className="flex flex-col gap-4 animate-fadeIn">
          {/* Subpage Header with Back to Fijos */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => switchSubpage('fijos')}
              className="flex items-center gap-1.5 text-xs text-[#bbcabf] hover:text-[#4edea3] font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver a Fijos</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-[#131b2e] text-[#ffb2b7] font-num text-[10px] uppercase font-bold border border-white/5">
              {debts.length} Pasivos
            </span>
          </div>

          {/* Subpage Title banner (sin subtítulo redundant) */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb2b7] text-[24px]">
                auto_graph
              </span>
              <h2 className="font-sans text-xl font-bold text-white tracking-tight">
                Deuda &amp; Amortización
              </h2>
            </div>
          </div>

          {/* Global Debt Stats Card */}
          <div className="bg-[#131b2e] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Principal Pendiente Global
                </span>
                <span className="font-num text-3xl text-[#ffb2b7] font-bold">
                  {currency}
                  {totalRemainingDebt.toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-num text-[10px] text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Ya Liquidado
                </span>
                <span className="font-num text-sm text-[#4edea3] font-bold">
                  {currency}
                  {totalDebtAmortized.toLocaleString('es-ES')} ({totalDebtProgress}%)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-[#222a3d] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#4edea3] rounded-l-full transition-all duration-700"
                style={{ width: `${totalDebtProgress}%` }}
              />
              <div
                className="h-full bg-[#ff7886] rounded-r-full transition-all duration-700"
                style={{ width: `${100 - totalDebtProgress}%` }}
              />
            </div>
          </div>

          {/* Botón para Crear Otros Tipos de Deuda */}
          <button
            type="button"
            onClick={() => setShowNewDebtModal(true)}
            className="w-full h-13 rounded-2xl bg-[#131b2e] hover:bg-[#171f33] text-[#ffb2b7] font-sans text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,120,134,0.12)] border border-[#ff7886]/30 active:scale-[0.99] transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[#ff7886]/20 flex items-center justify-center text-[#ffb2b7]">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </div>
            <span>Añadir Nueva Deuda / Pasivo</span>
          </button>

          {/* Debt Cards List with Delete option */}
          <div className="flex flex-col gap-3">
            {debts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#131b2e] border border-white/5 text-center text-[#bbcabf]">
                <span className="material-symbols-outlined text-[32px] text-[#4edea3] mb-2">
                  verified
                </span>
                <p className="font-sans text-sm font-semibold text-white">
                  ¡No tienes deudas activas!
                </p>
                <p className="font-sans text-xs mt-1">
                  Usa el botón superior si necesitas registrar un nuevo préstamo o pasivo.
                </p>
              </div>
            ) : (
              debts.map((debt) => {
                const amortized = debt.amortizedAmount || 0;
                const remaining = Math.max(0, debt.initialAmount - amortized);
                const liquidPercent = Math.min(
                  100,
                  Math.round((amortized / (debt.initialAmount || 1)) * 100)
                );
                const pendingPercent = 100 - liquidPercent;

                return (
                  <div
                    key={debt.id}
                    className="bg-[#131b2e] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col gap-3.5 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#222a3d] flex items-center justify-center text-[#ffb2b7] border border-white/5">
                          <span className="material-symbols-outlined text-[24px]">
                            {debt.icon || 'trending_down'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-sans text-sm font-bold text-white">{debt.name}</h3>
                            {debt.interestRate !== undefined && (
                              <span className="px-2 py-0.5 rounded-full bg-[#222a3d] text-[#bbcabf] font-num text-[10px]">
                                {debt.interestRate.toFixed(2)}% TIN
                              </span>
                            )}
                          </div>
                          <span className="font-sans text-xs text-[#bbcabf]">
                            Importe concedido: {currency}
                            {debt.initialAmount.toLocaleString('es-ES')}
                          </span>
                        </div>
                      </div>

                      {/* Priority Tag, Edit Button & Delete Button */}
                      <div className="flex items-center gap-1.5">
                        {debt.priority !== undefined && (
                          <span className="font-num text-[10px] px-2 py-1 rounded bg-[#ff7886]/10 text-[#ffb2b7] font-bold uppercase border border-[#ff7886]/20">
                            Prioridad {debt.priority}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEditDebt(debt)}
                          className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[#bbcabf] hover:text-[#4edea3] flex items-center justify-center transition-colors border border-white/5"
                          title="Modificar Deuda (acumulado amortizado o total a amortizar)"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteDebt(debt.id);
                            triggerHaptic(20);
                            playKeypadTone(350, 30);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#ff7886]/20 text-[#86948a] hover:text-[#ff7886] flex items-center justify-center transition-colors border border-white/5"
                          title="Eliminar Deuda"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Indicators - Clickable to open modification */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditDebt(debt)}
                        className="p-2.5 rounded-xl bg-[#222a3d]/60 hover:bg-[#222a3d] flex flex-col border border-white/5 text-left transition-colors group cursor-pointer"
                        title="Clic para modificar importe acumulado amortizado"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-num text-[10px] text-[#4edea3] uppercase font-bold">
                            Amortizado
                          </span>
                          <span className="material-symbols-outlined text-[13px] text-[#86948a] group-hover:text-[#4edea3] transition-colors">
                            edit
                          </span>
                        </div>
                        <span className="font-num text-lg text-[#4edea3] font-bold">
                          {currency}
                          {amortized.toLocaleString('es-ES')}
                        </span>
                        <span className="font-num text-[10px] text-[#bbcabf] mt-0.5 flex items-center gap-1">
                          <span>Vía abonos &amp; acumulado</span>
                          <span className="text-[9px] text-[#4edea3] opacity-0 group-hover:opacity-100 transition-opacity">
                            (Modificar)
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditDebt(debt)}
                        className="p-2.5 rounded-xl bg-[#222a3d]/60 hover:bg-[#222a3d] flex flex-col text-right border border-white/5 transition-colors group cursor-pointer"
                        title="Clic para modificar total a amortizar"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="material-symbols-outlined text-[13px] text-[#86948a] group-hover:text-[#ffb2b7] transition-colors">
                            tune
                          </span>
                          <span className="font-num text-[10px] text-[#ffb2b7] uppercase font-bold">
                            Principal Restante
                          </span>
                        </div>
                        <span className="font-num text-lg text-[#ffb2b7] font-bold">
                          {currency}
                          {remaining.toLocaleString('es-ES')}
                        </span>
                        <span className="font-num text-[10px] text-[#bbcabf] mt-0.5 flex items-center justify-end gap-1">
                          <span className="text-[9px] text-[#ffb2b7] opacity-0 group-hover:opacity-100 transition-opacity">
                            (Modificar total)
                          </span>
                          <span>{pendingPercent}% pendiente</span>
                        </span>
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="w-full h-2.5 bg-[#222a3d] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#4edea3] rounded-l-full transition-all duration-700"
                          style={{ width: `${liquidPercent}%` }}
                        />
                        <div
                          className="h-full bg-[#ff7886] rounded-r-full transition-all duration-700"
                          style={{ width: `${pendingPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center font-num text-[11px] text-[#bbcabf]">
                        <span className="text-[#4edea3] font-bold">{liquidPercent}% Liquidado</span>
                        {debt.estimatedEndDate ? (
                          <span>Fin estimado: {debt.estimatedEndDate}</span>
                        ) : (
                          <span>Sin fecha fin</span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Modificar & Abonar */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditDebt(debt)}
                        className="py-1.5 px-3 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-[#bbcabf] hover:text-white transition-all flex items-center gap-1.5 border border-white/5 active:scale-95"
                        title="Modificar importe acumulado o total a amortizar"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#4edea3]">
                          tune
                        </span>
                        <span>Modificar Deuda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAmortizeDebtId(debt.id);
                          setAmortizeAmountInput('250');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-all flex items-center gap-1 border border-white/5 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#4edea3]">
                          add_circle
                        </span>
                        <span>Abonar Cuota Extra</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODALES */}
      {/* ========================================================================= */}

      {/* MODAL: Añadir Nueva Deuda / Pasivo */}
      {showNewDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ffb2b7] text-[20px]">
                  trending_down
                </span>
                Añadir Deuda o Crédito
              </h3>
              <button
                type="button"
                onClick={() => setShowNewDebtModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Concepto de la Deuda</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tarjeta de Crédito, Préstamo Reforma"
                  value={newDebtName}
                  onChange={(e) => setNewDebtName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff7886]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Importe Total ({currency})</label>
                  <input
                    type="number"
                    required
                    step="50"
                    placeholder="3000"
                    value={newDebtInitial}
                    onChange={(e) => setNewDebtInitial(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#ff7886]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Ya Amortizado ({currency}) (opcional)</label>
                  <input
                    type="number"
                    step="50"
                    placeholder="0"
                    value={newDebtAmortized}
                    onChange={(e) => setNewDebtAmortized(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#ff7886]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Interés (TIN %) (opcional)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="4.5"
                    value={newDebtInterest}
                    onChange={(e) => setNewDebtInterest(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#ff7886]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Prioridad (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newDebtPriority}
                    onChange={(e) => setNewDebtPriority(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#ff7886]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Fecha Fin Estimada (opcional)</label>
                <input
                  type="text"
                  placeholder="Diciembre 2027"
                  value={newDebtEndDate}
                  onChange={(e) => setNewDebtEndDate(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff7886]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDebtModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#ff7886] text-[#780021] text-xs font-bold shadow-md hover:bg-[#ffb2b7] active:scale-95 transition-all"
                >
                  Guardar Deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Cuenta de Ahorro */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">savings</span>
                Nueva Meta de Ahorro
              </h3>
              <button
                type="button"
                onClick={() => setShowNewGoalModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Entrada Vivienda, Vacaciones"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Objetivo ({currency}) (opcional)</label>
                  <input
                    type="number"
                    step="50"
                    placeholder="5000"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Ya Ahorrado ({currency}) (opcional)</label>
                  <input
                    type="number"
                    step="50"
                    placeholder="0"
                    value={newGoalInitial}
                    onChange={(e) => setNewGoalInitial(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">
                    Aporte Mensual ({currency}) (opcional)
                  </label>
                  <input
                    type="number"
                    placeholder="300"
                    value={newGoalMonthly}
                    onChange={(e) => setNewGoalMonthly(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#bbcabf] font-num">Etiqueta (opcional)</label>
                  <input
                    type="text"
                    placeholder="NIVEL 1"
                    value={newGoalTag}
                    onChange={(e) => setNewGoalTag(e.target.value.toUpperCase())}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              {Boolean(newGoalMonthly && parseFloat(newGoalMonthly) > 0) && (
                <div className="p-3 rounded-xl bg-[#0b1326] border border-[#4edea3]/20 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[#4edea3] text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">autorenew</span>
                    <span>Automatización Mensual</span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf] leading-snug">
                    Se descontará de forma recurrente cada mes de tu Capital Disponible Real y se sumará a esta cuenta.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={applyFirstContributionNow}
                      onChange={(e) => setApplyFirstContributionNow(e.target.checked)}
                      className="rounded text-[#4edea3] focus:ring-0 bg-[#222a3d] border-white/20"
                    />
                    <span className="text-xs text-white">
                      Aplicar primer aporte ya este mes ({currentMonthName})
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Fecha Estimada (opcional)</label>
                <input
                  type="text"
                  placeholder="Diciembre 2026"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md hover:bg-[#45caa2] active:scale-95 transition-all"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajustar Cuenta de Ahorro & Aporte Mensual */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">tune</span>
                Ajustar Cuenta &amp; Aporte
              </h3>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditedGoal} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={editGoalName}
                  onChange={(e) => setEditGoalName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Aporte Mensual Automático ({currency}) (opcional)
                </label>
                <input
                  type="number"
                  placeholder="0 = sin débito automático"
                  value={editGoalMonthly}
                  onChange={(e) => setEditGoalMonthly(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
                <span className="text-[11px] text-[#86948a] mt-1 block">
                  Esta cantidad se descontará de forma automática cada mes de tu Capital Disponible Real.
                </span>
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Meta Objetivo ({currency}) (opcional)
                </label>
                <input
                  type="number"
                  placeholder="Sin objetivo"
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md hover:bg-[#45caa2] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Añadir Gasto Fijo */}
      {showNewFixedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                  receipt_long
                </span>
                Añadir Compromiso Fijo
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFixedModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateFixed} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gimnasio, Seguro Dental"
                  value={newFixedName}
                  onChange={(e) => setNewFixedName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Importe Mensual ({currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="45.00"
                  value={newFixedAmount}
                  onChange={(e) => setNewFixedAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nota / Vencimiento</label>
                <input
                  type="text"
                  placeholder="Vencimiento día 10"
                  value={newFixedDueDate}
                  onChange={(e) => setNewFixedDueDate(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Selector de Meses de Aplicación */}
              <MonthSelectorField
                label="Mes o Meses en los que se aplica"
                selectedMonths={newFixedMonths}
                onChange={setNewFixedMonths}
                accentColor="red"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFixedModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#ff7886] text-[#780021] text-xs font-bold shadow-md hover:bg-[#ffb2b7] active:scale-95 transition-all"
                >
                  Guardar Gasto Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Modificar Gasto Fijo */}
      {editingFixedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ff7886] text-[20px]">
                  edit_note
                </span>
                Modificar Gasto Fijo
              </h3>
              <button
                type="button"
                onClick={() => setEditingFixedExpense(null)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditFixedExpense} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Concepto</label>
                <input
                  type="text"
                  required
                  value={editFixedName}
                  onChange={(e) => setEditFixedName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff7886]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Importe Mensual ({currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={editFixedAmount}
                  onChange={(e) => setEditFixedAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#ff7886]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nota / Vencimiento</label>
                <input
                  type="text"
                  value={editFixedDueDate}
                  onChange={(e) => setEditFixedDueDate(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff7886]"
                />
              </div>

              {/* Selector de Meses de Aplicación */}
              <MonthSelectorField
                label="Mes o Meses en los que se aplica"
                selectedMonths={editFixedMonths}
                onChange={setEditFixedMonths}
                accentColor="red"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFixedExpense(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#ff7886] text-[#780021] text-xs font-bold shadow-md hover:bg-[#ffb2b7] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Añadir Ingreso Fijo */}
      {showNewIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                  payments
                </span>
                Añadir Ingreso Fijo
              </h3>
              <button
                type="button"
                onClick={() => setShowNewIncomeModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateFixedIncome} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nombre del Ingreso</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Nómina Principal, Rentas, Pensión"
                  value={newIncomeName}
                  onChange={(e) => setNewIncomeName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Importe Mensual ({currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="2500.00"
                  value={newIncomeAmount}
                  onChange={(e) => setNewIncomeAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nota / Periodicidad</label>
                <input
                  type="text"
                  placeholder="Cobro mensual (Día 1)"
                  value={newIncomePeriodicity}
                  onChange={(e) => setNewIncomePeriodicity(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Selector de Meses de Cobro / Aplicación */}
              <MonthSelectorField
                label="Mes o Meses en los que se percibe"
                selectedMonths={newIncomeMonths}
                onChange={setNewIncomeMonths}
                accentColor="green"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncomeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md hover:bg-[#6ffbbe] active:scale-95 transition-all"
                >
                  Guardar Ingreso Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Modificar Ingreso Fijo */}
      {editingFixedIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                  edit_note
                </span>
                Modificar Ingreso Fijo
              </h3>
              <button
                type="button"
                onClick={() => setEditingFixedIncome(null)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditFixedIncome} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nombre del Ingreso</label>
                <input
                  type="text"
                  required
                  value={editIncomeName}
                  onChange={(e) => setEditIncomeName(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">
                  Importe Mensual ({currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={editIncomeAmount}
                  onChange={(e) => setEditIncomeAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Nota / Periodicidad</label>
                <input
                  type="text"
                  value={editIncomePeriodicity}
                  onChange={(e) => setEditIncomePeriodicity(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Selector de Meses de Cobro / Aplicación */}
              <MonthSelectorField
                label="Mes o Meses en los que se percibe"
                selectedMonths={editIncomeMonths}
                onChange={setEditIncomeMonths}
                accentColor="green"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFixedIncome(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md hover:bg-[#6ffbbe] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Aportar a Meta */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3]">
                <span className="material-symbols-outlined text-[19px]">payments</span>
              </div>
              <h3 className="font-sans text-base font-bold text-white">Abonar a Cuenta de Ahorro</h3>
            </div>
            <p className="text-xs text-[#bbcabf] leading-snug">
              Este aporte se sumará a tus ahorros y se descontará directamente del <strong>Capital Disponible Real</strong> registrándose como gasto en Movimientos.
            </p>
            <div>
              <label className="text-xs text-[#bbcabf] font-num">Cantidad a aportar ({currency})</label>
              <input
                type="number"
                step="10"
                value={customContributionAmount}
                onChange={(e) => setCustomContributionAmount(e.target.value)}
                className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-lg text-white font-bold focus:outline-none focus:border-[#4edea3]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContributeGoalId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickContribute}
                className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md hover:bg-[#45caa2] active:scale-95 transition-all"
              >
                Aportar y Descontar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Abonar Cuota Extraordinaria a Deuda */}
      {amortizeDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-4">
            <h3 className="font-sans text-base font-bold text-white">Abono Extraordinario a Deuda</h3>
            <p className="text-xs text-[#bbcabf]">
              Se reducirá directamente del principal restante, acortando el plazo del crédito.
            </p>
            <div>
              <label className="text-xs text-[#bbcabf] font-num">Monto a amortizar ({currency})</label>
              <input
                type="number"
                step="25"
                value={amortizeAmountInput}
                onChange={(e) => setAmortizeAmountInput(e.target.value)}
                className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-lg text-white font-bold focus:outline-none focus:border-[#4edea3]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmortizeDebtId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickAmortize}
                className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold shadow-md"
              >
                Amortizar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modificar Deuda / Pasivo (Importe acumulado, Total a amortizar, etc.) */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff7886]/20 flex items-center justify-center text-[#ffb2b7]">
                  <span className="material-symbols-outlined text-[19px]">tune</span>
                </div>
                <h3 className="font-sans text-base font-bold text-white">Modificar Deuda</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDebt(null)}
                className="text-[#bbcabf] hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditDebt} className="flex flex-col gap-3.5">
              {/* Concepto */}
              <div>
                <label className="text-xs text-[#bbcabf] font-sans font-semibold">
                  Concepto / Nombre de la Deuda
                </label>
                <input
                  type="text"
                  required
                  value={editDebtName}
                  onChange={(e) => setEditDebtName(e.target.value)}
                  placeholder="Ej. Tarjeta de Crédito, Hipoteca"
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Total a amortizar (Importe concedido inicial) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#bbcabf] font-sans font-semibold">
                    Total a amortizar / Concedido ({currency})
                  </label>
                  <span className="text-[10px] text-[#86948a] font-num">Importe global</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editDebtInitialAmount}
                  onChange={(e) => setEditDebtInitialAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-base font-bold text-white focus:outline-none focus:border-[#4edea3]"
                />
                <p className="text-[11px] text-[#86948a] mt-0.5 leading-snug">
                  Monto total de la deuda acordado para liquidar.
                </p>
              </div>

              {/* Importe ya acumulado amortizado */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#bbcabf] font-sans font-semibold">
                    Importe ya acumulado amortizado ({currency})
                  </label>
                  <span className="text-[10px] text-[#4edea3] font-num font-bold">Liquidado hasta hoy</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editDebtAmortizedAmount}
                  onChange={(e) => setEditDebtAmortizedAmount(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-base font-bold text-[#4edea3] focus:outline-none focus:border-[#4edea3]"
                />
                <p className="text-[11px] text-[#86948a] mt-0.5 leading-snug">
                  Modifica este valor si deseas ajustar el importe total que ya has amortizado.
                </p>

                {/* Botones de ajuste rápido de acumulado */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-[#bbcabf]">Ajuste rápido:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(editDebtAmortizedAmount) || 0;
                      setEditDebtAmortizedAmount((current + 100).toFixed(2));
                      playKeypadTone(480, 15);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[11px] font-num text-white border border-white/5"
                  >
                    +100{currency}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(editDebtAmortizedAmount) || 0;
                      setEditDebtAmortizedAmount((current + 500).toFixed(2));
                      playKeypadTone(520, 15);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[11px] font-num text-white border border-white/5"
                  >
                    +500{currency}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDebtAmortizedAmount(editDebtInitialAmount);
                      playKeypadTone(600, 15);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[11px] font-num text-[#4edea3] font-bold border border-[#4edea3]/30"
                    title="Marcar como liquidada al 100%"
                  >
                    100% Saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDebtAmortizedAmount('0');
                      playKeypadTone(350, 15);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#222a3d] hover:bg-[#2d3449] text-[11px] font-num text-[#86948a]"
                    title="Reiniciar amortizado a 0"
                  >
                    0{currency}
                  </button>
                </div>
              </div>

              {/* Vista Previa de Saldo Restante en tiempo real */}
              {(() => {
                const initVal = parseFloat(editDebtInitialAmount) || 0;
                const amortVal = parseFloat(editDebtAmortizedAmount) || 0;
                const restVal = Math.max(0, initVal - amortVal);
                const progPct = initVal > 0 ? Math.min(100, Math.round((amortVal / initVal) * 100)) : 0;

                return (
                  <div className="p-3 rounded-xl bg-[#0b1326] border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#bbcabf]">Principal pendiente resultante:</span>
                      <span className="font-num text-sm font-bold text-[#ffb2b7]">
                        {currency}{restVal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#222a3d] rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[#4edea3] rounded-l-full transition-all"
                        style={{ width: `${progPct}%` }}
                      />
                      <div
                        className="h-full bg-[#ff7886] rounded-r-full transition-all"
                        style={{ width: `${100 - progPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-num text-[#86948a]">
                      <span className="text-[#4edea3] font-semibold">{progPct}% liquidado</span>
                      <span>{100 - progPct}% pendiente</span>
                    </div>
                  </div>
                );
              })()}

              {/* TIN & Prioridad */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-[#bbcabf] font-sans">Tipo TIN (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="Ej. 4.75"
                    value={editDebtInterestRate}
                    onChange={(e) => setEditDebtInterestRate(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#bbcabf] font-sans">Prioridad (1-5)</label>
                  <select
                    value={editDebtPriority}
                    onChange={(e) => setEditDebtPriority(e.target.value)}
                    className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="1">1 - Muy Alta</option>
                    <option value="2">2 - Alta</option>
                    <option value="3">3 - Media</option>
                    <option value="4">4 - Baja</option>
                    <option value="5">5 - Muy Baja</option>
                  </select>
                </div>
              </div>

              {/* Fecha estimada de fin */}
              <div>
                <label className="text-xs text-[#bbcabf] font-sans">Fecha Estimada de Cancelación</label>
                <input
                  type="text"
                  placeholder="Ej. Dic 2027 o 2028"
                  value={editDebtEndDate}
                  onChange={(e) => setEditDebtEndDate(e.target.value)}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Icono de la deuda */}
              <div>
                <label className="text-xs text-[#bbcabf] font-sans mb-1.5 block">Icono identificativo</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { id: 'trending_down', label: 'Baja' },
                    { id: 'credit_card', label: 'Tarjeta' },
                    { id: 'home', label: 'Hipoteca' },
                    { id: 'directions_car', label: 'Coche' },
                    { id: 'school', label: 'Estudios' },
                    { id: 'receipt_long', label: 'Préstamo' },
                  ].map((ico) => (
                    <button
                      key={ico.id}
                      type="button"
                      onClick={() => setEditDebtIcon(ico.id)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        editDebtIcon === ico.id
                          ? 'bg-[#4edea3] text-[#003824] shadow'
                          : 'bg-[#0b1326] text-[#bbcabf] hover:text-white border border-white/5'
                      }`}
                      title={ico.label}
                    >
                      <span className="material-symbols-outlined text-[19px]">{ico.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDebt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
