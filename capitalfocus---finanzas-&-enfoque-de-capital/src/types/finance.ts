export type Currency = '€';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  concept: string;
  category: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // e.g. "09:42 AM"
  icon: string;
  currency: Currency;
}

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'emerald';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  theme?: ThemeMode;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDateNote: string;
  icon: string;
  applicableMonths?: number[]; // 1 = Enero ... 12 = Diciembre. Undefined or empty means all months.
}

export interface FixedIncome {
  id: string;
  name: string;
  amount: number;
  category: string;
  periodicityNote?: string;
  icon: string;
  applicableMonths?: number[]; // 1 = Enero ... 12 = Diciembre. Undefined or empty means all months.
}

export interface SavingsGoal {
  id: string;
  name: string;
  tag: string; // e.g. "NIVEL 4", "EXPEDICIÓN"
  currentAmount?: number;
  targetAmount?: number;
  monthlyContribution?: number;
  targetDateStr?: string;
  icon: string;
  imageUrl?: string;
  lastContributionMonth?: string; // YYYY-MM e.g. "2026-10"
  autoContributeEnabled?: boolean;
}

export interface DebtItem {
  id: string;
  name: string;
  interestRate?: number; // TIN percentage, e.g. 5.25
  initialAmount: number;
  amortizedAmount?: number;
  priority?: number;
  estimatedEndDate?: string;
  icon?: string;
}

export interface FinanceData {
  currency: Currency;
  baseIncome: number;
  variableBudget?: number;
  userProfile?: UserProfile;
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  fixedIncomes?: FixedIncome[];
  savingsGoals: SavingsGoal[];
  debts: DebtItem[];
  pinCode: string;
  customCategories: Array<{ name: string; icon: string }>;
}
