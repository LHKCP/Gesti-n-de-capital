import { FinanceData, SavingsGoal, Transaction } from '../types/finance';

/**
 * Returns the current year and month formatted as "YYYY-MM" (e.g., "2026-11")
 */
export function getCurrentMonthKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentMonthName(d: Date = new Date()): string {
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
  return monthNames[d.getMonth()];
}

export interface MonthlyAutomationResult {
  updatedData: FinanceData;
  updatedGoals: SavingsGoal[];
  executedCount: number;
  totalContributed: number;
  newTransactions: Transaction[];
}

/**
 * Checks all savings goals with an active monthly contribution.
 * If a goal has not contributed yet for the current month, this automatically increments
 * the goal's accumulated amount (currentAmount += monthlyContribution) and creates an automated
 * transaction with category 'Ahorro' so it is discounted in FOCO.
 */
export function checkAndProcessMonthlyContributions(data: FinanceData): MonthlyAutomationResult {
  const currentMonthKey = getCurrentMonthKey();
  const newTransactions: Transaction[] = [];
  const updatedGoalsList: SavingsGoal[] = [];
  let executedCount = 0;
  let totalContributed = 0;

  const updatedGoals: SavingsGoal[] = (data.savingsGoals || []).map((goal) => {
    const monthly = goal.monthlyContribution;
    const isAutoActive = goal.autoContributeEnabled !== false;

    // Must have a positive monthly contribution and automation enabled
    if (!monthly || monthly <= 0 || !isAutoActive) {
      return goal;
    }

    // Check if an automated transaction already exists for this goal and month
    const autoTxId = `tx-auto-save-${goal.id}-${currentMonthKey}`;
    const alreadyProcessedInTx = (data.transactions || []).some(
      (tx) =>
        tx.id === autoTxId ||
        (tx.category === 'Ahorro' &&
          tx.dateStr.startsWith(currentMonthKey) &&
          tx.concept.includes(goal.name) &&
          tx.concept.toLowerCase().includes('automático'))
    );

    const alreadyMarkedInGoal = goal.lastContributionMonth === currentMonthKey;

    if (alreadyProcessedInTx || alreadyMarkedInGoal) {
      // Already contributed for this month
      if (goal.lastContributionMonth !== currentMonthKey) {
        const fixedGoal = { ...goal, lastContributionMonth: currentMonthKey };
        updatedGoalsList.push(fixedGoal);
        return fixedGoal;
      }
      return goal;
    }

    // Execute automated contribution for this month
    executedCount += 1;
    totalContributed += monthly;

    const autoTx: Transaction = {
      id: autoTxId,
      type: 'expense',
      amount: monthly,
      concept: `Aporte mensual automático: ${goal.name}`,
      category: 'Ahorro',
      dateStr: `${currentMonthKey}-01`,
      timeStr: '08:00 AM',
      icon: 'savings',
      currency: data.currency || '€',
    };

    newTransactions.push(autoTx);

    const updatedGoal: SavingsGoal = {
      ...goal,
      currentAmount: (goal.currentAmount || 0) + monthly,
      lastContributionMonth: currentMonthKey,
      autoContributeEnabled: true,
    };
    updatedGoalsList.push(updatedGoal);
    return updatedGoal;
  });

  if (executedCount === 0 && updatedGoalsList.length === 0) {
    return {
      updatedData: data,
      updatedGoals: [],
      executedCount: 0,
      totalContributed: 0,
      newTransactions: [],
    };
  }

  const updatedData: FinanceData = {
    ...data,
    savingsGoals: updatedGoals,
    transactions: [...newTransactions, ...data.transactions],
  };

  return {
    updatedData,
    updatedGoals: updatedGoalsList,
    executedCount,
    totalContributed,
    newTransactions,
  };
}
