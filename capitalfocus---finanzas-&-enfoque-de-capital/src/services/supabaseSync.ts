import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  FinanceData,
  Transaction,
  FixedExpense,
  FixedIncome,
  SavingsGoal,
  DebtItem,
  UserProfile,
} from '../types/finance';
import { INITIAL_DATA } from '../utils/storage';

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function fetchRemoteFinanceData(customUserId?: string): Promise<FinanceData | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const userId = customUserId || (await getCurrentUserId());
  if (!userId) {
    return null;
  }

  try {
    // 1. Fetch user's profile
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch transactions for this user
    const { data: txRows } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', userId)
      .order('date_str', { ascending: false });

    // 3. Fetch fixed expenses
    const { data: feRows } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('profile_id', userId);

    // 4. Fetch fixed incomes
    const { data: fiRows } = await supabase
      .from('fixed_incomes')
      .select('*')
      .eq('profile_id', userId);

    // 5. Fetch savings goals
    const { data: sgRows } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('profile_id', userId);

    // 6. Fetch debts
    const { data: debtRows } = await supabase
      .from('debts')
      .select('*')
      .eq('profile_id', userId)
      .order('priority', { ascending: true });

    // 7. Fetch custom categories
    const { data: catRows } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('profile_id', userId);

    const userProfile: UserProfile = {
      name: profileRow?.name || INITIAL_DATA.userProfile?.name || 'Usuario',
      email: profileRow?.email || '',
      avatarUrl: profileRow?.avatar_url || INITIAL_DATA.userProfile?.avatarUrl || '',
      bio: profileRow?.bio || INITIAL_DATA.userProfile?.bio,
      theme: profileRow?.theme || INITIAL_DATA.userProfile?.theme || 'dark',
    };

    const transactions: Transaction[] = (txRows || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount) || 0,
      concept: t.concept,
      category: t.category,
      dateStr: t.date_str,
      timeStr: t.time_str,
      icon: t.icon || 'payments',
      currency: '€',
    }));

    const fixedExpenses: FixedExpense[] = (feRows || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      amount: Number(f.amount) || 0,
      category: f.category,
      dueDateNote: f.due_date_note || '',
      icon: f.icon || 'receipt',
      applicableMonths: Array.isArray(f.applicable_months) ? f.applicable_months : undefined,
    }));

    const fixedIncomes: FixedIncome[] = (fiRows || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      amount: Number(i.amount) || 0,
      category: i.category,
      periodicityNote: i.periodicity_note || '',
      icon: i.icon || 'payments',
      applicableMonths: Array.isArray(i.applicable_months) ? i.applicable_months : undefined,
    }));

    const savingsGoals: SavingsGoal[] = (sgRows || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      tag: s.tag || '',
      currentAmount: Number(s.current_amount) || 0,
      targetAmount: Number(s.target_amount) || 0,
      monthlyContribution: Number(s.monthly_contribution) || 0,
      targetDateStr: s.target_date_str || '',
      icon: s.icon || 'savings',
      imageUrl: s.image_url || undefined,
      lastContributionMonth: s.last_contribution_month || undefined,
      autoContributeEnabled: s.auto_contribute_enabled ?? true,
    }));

    const debts: DebtItem[] = (debtRows || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      interestRate: d.interest_rate !== null ? Number(d.interest_rate) : undefined,
      initialAmount: Number(d.initial_amount) || 0,
      amortizedAmount: Number(d.amortized_amount) || 0,
      priority: d.priority || 1,
      estimatedEndDate: d.estimated_end_date || undefined,
      icon: d.icon || 'credit_card',
    }));

    const customCategories = (catRows && catRows.length > 0)
      ? catRows.map((c: any) => ({ name: c.name, icon: c.icon }))
      : INITIAL_DATA.customCategories;

    const baseIncome = fixedIncomes.length > 0
      ? fixedIncomes.reduce((sum, fi) => sum + fi.amount, 0)
      : (profileRow?.base_income ? Number(profileRow.base_income) : 0);

    return {
      currency: '€',
      baseIncome,
      pinCode: profileRow?.pin_code || '1234',
      userProfile,
      transactions,
      fixedExpenses,
      fixedIncomes,
      savingsGoals,
      debts,
      customCategories,
    };
  } catch (error) {
    console.warn('Error fetching remote finance data from Supabase:', error);
    return null;
  }
}

// Granular asynchronous sync functions with authenticated user ID
export async function syncTransactionRemote(tx: Transaction): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('transactions').upsert({
      id: tx.id,
      profile_id: userId,
      type: tx.type,
      amount: tx.amount,
      concept: tx.concept,
      category: tx.category,
      date_str: tx.dateStr,
      time_str: tx.timeStr,
      icon: tx.icon,
      currency: tx.currency || '€',
    });
  } catch (err) {
    console.warn('Failed to sync transaction to Supabase:', err);
  }
}

export async function deleteTransactionRemote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('transactions').delete().eq('id', id).eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to delete transaction from Supabase:', err);
  }
}

export async function clearTransactionsRemote(): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('transactions').delete().eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to clear transactions in Supabase:', err);
  }
}

export async function syncFixedExpenseRemote(item: FixedExpense): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('fixed_expenses').upsert({
      id: item.id,
      profile_id: userId,
      name: item.name,
      amount: item.amount,
      category: item.category,
      due_date_note: item.dueDateNote,
      icon: item.icon,
      applicable_months: item.applicableMonths || [],
    });
  } catch (err) {
    console.warn('Failed to sync fixed expense to Supabase:', err);
  }
}

export async function deleteFixedExpenseRemote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('fixed_expenses').delete().eq('id', id).eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to delete fixed expense from Supabase:', err);
  }
}

export async function syncFixedIncomeRemote(item: FixedIncome): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('fixed_incomes').upsert({
      id: item.id,
      profile_id: userId,
      name: item.name,
      amount: item.amount,
      category: item.category,
      periodicity_note: item.periodicityNote || '',
      icon: item.icon,
      applicable_months: item.applicableMonths || [],
    });
  } catch (err) {
    console.warn('Failed to sync fixed income to Supabase:', err);
  }
}

export async function deleteFixedIncomeRemote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('fixed_incomes').delete().eq('id', id).eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to delete fixed income from Supabase:', err);
  }
}

export async function syncSavingsGoalRemote(item: SavingsGoal): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('savings_goals').upsert({
      id: item.id,
      profile_id: userId,
      name: item.name,
      tag: item.tag,
      current_amount: item.currentAmount || 0,
      target_amount: item.targetAmount || 0,
      monthly_contribution: item.monthlyContribution || 0,
      target_date_str: item.targetDateStr || '',
      icon: item.icon,
      image_url: item.imageUrl || null,
      last_contribution_month: item.lastContributionMonth || null,
      auto_contribute_enabled: item.autoContributeEnabled ?? true,
    });
  } catch (err) {
    console.warn('Failed to sync savings goal to Supabase:', err);
  }
}

export async function deleteSavingsGoalRemote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('savings_goals').delete().eq('id', id).eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to delete savings goal from Supabase:', err);
  }
}

export async function syncDebtRemote(item: DebtItem): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('debts').upsert({
      id: item.id,
      profile_id: userId,
      name: item.name,
      interest_rate: item.interestRate ?? null,
      initial_amount: item.initialAmount,
      amortized_amount: item.amortizedAmount || 0,
      priority: item.priority || 1,
      estimated_end_date: item.estimatedEndDate || null,
      icon: item.icon || 'credit_card',
    });
  } catch (err) {
    console.warn('Failed to sync debt to Supabase:', err);
  }
}

export async function deleteDebtRemote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('debts').delete().eq('id', id).eq('profile_id', userId);
  } catch (err) {
    console.warn('Failed to delete debt from Supabase:', err);
  }
}

export async function syncProfileRemote(
  profile: UserProfile,
  pinCode: string,
  currency: string = '€',
  baseIncome?: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatarUrl,
      bio: profile.bio || '',
      theme: profile.theme || 'dark',
      pin_code: pinCode,
      currency,
      ...(baseIncome !== undefined ? { base_income: baseIncome } : {}),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to sync profile to Supabase:', err);
  }
}
