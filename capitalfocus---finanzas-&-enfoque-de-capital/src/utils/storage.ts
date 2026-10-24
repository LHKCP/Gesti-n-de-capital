import { FinanceData } from '../types/finance';
import { checkAndProcessMonthlyContributions } from './savingsAutomation';

const STORAGE_KEY = 'capitalfocus_state_v1';

export const INITIAL_DATA: FinanceData = {
  currency: '€',
  baseIncome: 4250,
  pinCode: '1234',
  userProfile: {
    name: 'Lucas Collazo',
    email: 'collazolucas@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    bio: 'Gestión patrimonial & finanzas personales',
    theme: 'dark',
  },
  customCategories: [
    { name: 'Supermercado', icon: 'local_grocery_store' },
    { name: 'Cafetería', icon: 'coffee' },
    { name: 'Transporte', icon: 'directions_subway' },
    { name: 'Restaurante', icon: 'restaurant' },
    { name: 'Farmacia', icon: 'medication' },
    { name: 'Ocio', icon: 'sports_esports' },
    { name: 'Hogar', icon: 'home' },
  ],
  transactions: [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 6.8,
      concept: 'Café de especialidad & tostada',
      category: 'Cafetería',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '09:42 AM',
      icon: 'coffee',
      currency: '€',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 27.5,
      concept: 'Supermercado fresco',
      category: 'Supermercado',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '01:15 PM',
      icon: 'local_grocery_store',
      currency: '€',
    },
    {
      id: 'tx-3',
      type: 'income',
      amount: 150.0,
      concept: 'Devolución / Venta segunda mano',
      category: 'Ingreso Extra',
      dateStr: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timeStr: '04:30 PM',
      icon: 'payments',
      currency: '€',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 15.0,
      concept: 'Recarga abono de metro',
      category: 'Transporte',
      dateStr: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timeStr: '08:10 AM',
      icon: 'directions_subway',
      currency: '€',
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 810.9,
      concept: 'Compras acumuladas de quincena',
      category: 'Supermercado',
      dateStr: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      timeStr: '11:20 AM',
      icon: 'shopping_cart',
      currency: '€',
    },
  ],
  fixedExpenses: [
    {
      id: 'fix-1',
      name: 'Alquiler / Hipoteca',
      amount: 900.0,
      category: 'Vivienda',
      dueDateNote: 'Vencimiento día 1',
      icon: 'apartment',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: 'fix-2',
      name: 'Seguros Pólizas',
      amount: 300.0,
      category: 'Seguros',
      dueDateNote: 'Salud + Hogar + Coche',
      icon: 'verified_user',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: 'fix-3',
      name: 'Suministros Básicos',
      amount: 180.0,
      category: 'Servicios',
      dueDateNote: 'Luz, Agua, Fibra',
      icon: 'bolt',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: 'fix-4',
      name: 'Suscripciones & Cloud',
      amount: 70.0,
      category: 'Digital',
      dueDateNote: 'Herramientas & Medios',
      icon: 'subscriptions',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: 'fix-5',
      name: 'Seguro Anual Vehículo',
      amount: 240.0,
      category: 'Transporte',
      dueDateNote: 'Pago anual recurrente',
      icon: 'directions_car',
      applicableMonths: [11], // Solo se aplica en Noviembre
    },
  ],
  fixedIncomes: [
    {
      id: 'inc-1',
      name: 'Nómina Principal',
      amount: 3200.0,
      category: 'Nómina',
      periodicityNote: 'Cobro mensual (Día 1)',
      icon: 'payments',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: 'inc-2',
      name: 'Rendimientos / Inversión',
      amount: 1050.0,
      category: 'Inversiones',
      periodicityNote: 'Mensual recurrente',
      icon: 'trending_up',
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
  savingsGoals: [
    {
      id: 'save-1',
      name: 'Fondo de Emergencia',
      tag: 'NIVEL 4',
      currentAmount: 6500,
      targetAmount: 10000,
      monthlyContribution: 300,
      targetDateStr: 'Noviembre 2027',
      icon: 'shield',
    },
    {
      id: 'save-2',
      name: 'Viaje Japón 2025',
      tag: 'EXPEDICIÓN',
      currentAmount: 2100,
      targetAmount: 3500,
      monthlyContribution: 233,
      targetDateStr: 'Octubre 2025',
      icon: 'flight_takeoff',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7qPUzuzwNzw440MmhuBHhO70q4wViG3JmVhvb2DtUinVLaHz9_A9UMMPzVJdpbgJ-vsiqsTlWfxdFNQzbVkES03QUqwLWx-A31TNlKafjTREtdYH6sToAtLrqxS8lby5li1v1dkeAKiD7Cvj2OzKjkoC25iJB0t7cpTa1weqRsoOWmRKzgaYqwzpxp-WWcJERYjeHj-76tX7vQb2tgOmtuTB9SE5zTSRgsz3pnjr0LDShGRtoOYLG6Q',
    },
  ],
  debts: [
    {
      id: 'debt-1',
      name: 'Préstamo Vehículo',
      interestRate: 5.25,
      initialAmount: 12000,
      amortizedAmount: 7850,
      priority: 1,
      estimatedEndDate: 'Agosto 2026',
      icon: 'directions_car',
    },
    {
      id: 'debt-2',
      name: 'Crédito Estudio Máster',
      interestRate: 3.1,
      initialAmount: 5000,
      amortizedAmount: 3200,
      priority: 2,
      estimatedEndDate: 'Enero 2026',
      icon: 'school',
    },
  ],
};

export const EMPTY_FINANCE_DATA: FinanceData = {
  currency: '€',
  baseIncome: 0,
  pinCode: '1234',
  userProfile: {
    name: 'Usuario',
    email: '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    bio: 'Gestión patrimonial & finanzas personales',
    theme: 'dark',
  },
  customCategories: [
    { name: 'Supermercado', icon: 'local_grocery_store' },
    { name: 'Cafetería', icon: 'coffee' },
    { name: 'Transporte', icon: 'directions_subway' },
    { name: 'Restaurante', icon: 'restaurant' },
    { name: 'Farmacia', icon: 'medication' },
    { name: 'Ocio', icon: 'sports_esports' },
    { name: 'Hogar', icon: 'home' },
  ],
  transactions: [],
  fixedExpenses: [],
  fixedIncomes: [],
  savingsGoals: [],
  debts: [],
};

export function getStorageKey(userId?: string): string {
  return userId ? `capitalfocus_state_${userId}` : STORAGE_KEY;
}

export function loadFinanceData(userId?: string): FinanceData {
  const fallback = userId ? EMPTY_FINANCE_DATA : INITIAL_DATA;
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const loaded = { ...fallback, ...parsed, currency: '€' as const };
    if (!loaded.pinCode || loaded.pinCode.length !== 4) {
      loaded.pinCode = loaded.pinCode && loaded.pinCode.length >= 4 ? loaded.pinCode.slice(0, 4) : '1234';
    }
    if (Array.isArray(loaded.transactions)) {
      loaded.transactions = loaded.transactions.map((tx: any) => ({
        ...tx,
        currency: '€',
      }));
    }

    if (userId) {
      // Don't inject demo incomes for authenticated users if they have none
      if (!Array.isArray(loaded.fixedIncomes)) {
        loaded.fixedIncomes = [];
      }
    } else {
      if (!Array.isArray(loaded.fixedIncomes) || loaded.fixedIncomes.length === 0) {
        loaded.fixedIncomes = INITIAL_DATA.fixedIncomes;
      }
    }

    // Keep baseIncome updated to sum of fixed incomes
    if (Array.isArray(loaded.fixedIncomes) && loaded.fixedIncomes.length > 0) {
      loaded.baseIncome = loaded.fixedIncomes.reduce((sum: number, inc: any) => sum + (inc.amount || 0), 0);
    }

    const { updatedData, executedCount } = checkAndProcessMonthlyContributions(loaded);
    if (executedCount > 0) {
      saveFinanceData(updatedData, userId);
      return updatedData;
    }
    return loaded;
  } catch {
    const { updatedData, executedCount } = checkAndProcessMonthlyContributions(fallback);
    if (executedCount > 0) {
      saveFinanceData(updatedData, userId);
      return updatedData;
    }
    return fallback;
  }
}

export function saveFinanceData(data: FinanceData, userId?: string): void {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearLocalFinanceData(userId?: string): void {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
