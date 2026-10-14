import React, { useState, useMemo } from 'react';
import { FinanceData } from '../types/finance';
import {
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  isItemActiveInMonth,
} from '../utils/monthUtils';

interface FocusScreenProps {
  data: FinanceData;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({ data }) => {
  const { currency, baseIncome, fixedExpenses, fixedIncomes, transactions } = data;

  // Current calendar month (1-12)
  const currentCalendarMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentCalendarMonth);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);

  // Filter fixed incomes that apply to the selected month
  const activeFixedIncomes = useMemo(() => {
    return (fixedIncomes || []).filter((inc) =>
      isItemActiveInMonth(inc.applicableMonths, selectedMonth)
    );
  }, [fixedIncomes, selectedMonth]);

  const inactiveFixedIncomes = useMemo(() => {
    return (fixedIncomes || []).filter(
      (inc) => !isItemActiveInMonth(inc.applicableMonths, selectedMonth)
    );
  }, [fixedIncomes, selectedMonth]);

  const totalFixedIncome = useMemo(() => {
    if (fixedIncomes && fixedIncomes.length > 0) {
      return activeFixedIncomes.reduce((sum, item) => sum + item.amount, 0);
    }
    return baseIncome;
  }, [fixedIncomes, activeFixedIncomes, baseIncome]);

  // Filter fixed expenses that apply to the selected month
  const activeFixedExpenses = useMemo(() => {
    return fixedExpenses.filter((fix) =>
      isItemActiveInMonth(fix.applicableMonths, selectedMonth)
    );
  }, [fixedExpenses, selectedMonth]);

  const inactiveFixedExpenses = useMemo(() => {
    return fixedExpenses.filter(
      (fix) => !isItemActiveInMonth(fix.applicableMonths, selectedMonth)
    );
  }, [fixedExpenses, selectedMonth]);

  // Real-time calculated metrics for the selected month
  const totalFixed = useMemo(() => {
    return activeFixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [activeFixedExpenses]);

  const totalMovementsExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalMovementsIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalSavingsDeducted = useMemo(() => {
    return transactions
      .filter((t) => t.category === 'Ahorro' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Total Ingresos = Ingresos Fijos + Ingresos de Movimientos
  const totalNetIncome = totalFixedIncome + totalMovementsIncome;

  // Capital Disponible Real:
  // (Ingresos Fijos + Ingresos de Movimientos) - Gastos Fijos - Gastos de Movimientos (incluyendo aportes a ahorro)
  const realAvailableCapital =
    totalNetIncome - totalFixed - totalMovementsExpenses;

  // Remaining days in month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay);
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const currentMonthName = monthNames[month];

  // Safe daily spend allowance without touching reserves
  const safeDailySpend = Math.max(0, Math.round(realAvailableCapital / remainingDays));

  // Reserve safety ratio
  const cushionPercent = Math.min(
    100,
    Math.max(0, Math.round((realAvailableCapital / (totalNetIncome || 1)) * 100))
  );

  return (
    <div className="w-full flex flex-col gap-4 max-w-lg mx-auto pb-10">
      {/* 1. Selector de Mes para Proyección & Verificación */}
      <div className="bg-[#131b2e] rounded-2xl p-3 border border-white/5 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
              calendar_month
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xs font-bold text-white">
                  Mes de cálculo: {MONTH_NAMES_FULL[selectedMonth - 1]}
                </span>
                {selectedMonth === currentCalendarMonth ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#4edea3]/15 text-[#4edea3] font-bold border border-[#4edea3]/20">
                    Mes actual
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#c0c1ff]/15 text-[#c0c1ff] font-bold border border-[#c0c1ff]/20">
                    Proyección
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#bbcabf]">
                {activeFixedExpenses.length} gastos y {activeFixedIncomes.length} ingresos fijos aplican este mes
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="text-xs text-[#bbcabf] hover:text-white px-2.5 py-1.5 rounded-xl bg-[#222a3d] border border-white/5 flex items-center gap-1 transition-colors"
          >
            <span>{showMonthPicker ? 'Cerrar' : 'Proyectar mes'}</span>
            <span className="material-symbols-outlined text-[15px]">
              {showMonthPicker ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showMonthPicker && (
          <div className="pt-2 border-t border-white/5 flex flex-col gap-2 animate-fadeIn">
            <span className="text-[11px] text-[#bbcabf]">
              Pulsa un mes para comprobar qué partidas fijas se computan automáticamente en esa fecha:
            </span>
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {MONTH_NAMES_SHORT.map((shortName, idx) => {
                const monthNum = idx + 1;
                const isCurrent = monthNum === currentCalendarMonth;
                const isSelected = monthNum === selectedMonth;
                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(monthNum);
                      setShowMonthPicker(false);
                    }}
                    className={`py-1.5 text-center rounded-lg text-xs font-num font-bold transition-all ${
                      isSelected
                        ? 'bg-[#4edea3] text-[#003824] shadow'
                        : isCurrent
                        ? 'bg-[#222a3d] text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#171f33] text-[#bbcabf] hover:text-white hover:bg-[#222a3d]'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Tarjeta Principal Dominante: Capital Disponible Real */}
      <div className="relative overflow-hidden rounded-2xl bg-[#131b2e] p-5 shadow-2xl border border-white/5">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#4edea3]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-[#c0c1ff]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-num text-[11px] text-[#bbcabf] uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#4edea3]">
                verified_user
              </span>
              Capital Disponible Real
            </span>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#222a3d] text-[#4edea3] border border-white/5">
              <span
                className="material-symbols-outlined text-[13px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield
              </span>
              <span className="font-num text-[11px] font-bold">
                Excelente • {cushionPercent}% colchón
              </span>
            </div>
          </div>

          <div className="py-1">
            <div className="flex items-baseline gap-1 text-[#4edea3]">
              <span className="font-sans text-2xl font-bold">{currency}</span>
              <span className="font-num text-4xl sm:text-5xl text-[#dae2fd] font-bold tracking-tight">
                {realAvailableCapital.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
            Dinero disponible real calculado en tiempo real: incluye los ingresos fijos y los ingresos de movimientos, descontando el 100% de gastos fijos y todos los gastos y aportes a ahorro registrados en Movimientos.
          </p>

          {/* Micro badges de balance directo */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-num">
            <span className="px-2 py-0.5 rounded-md bg-[#222a3d] text-[#bbcabf] border border-white/5">
              Ingresos Fijos: <strong className="text-[#4edea3] font-semibold">+{currency}{totalFixedIncome.toLocaleString('es-ES')}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#222a3d] text-[#bbcabf] border border-white/5">
              Gastos Fijos: <strong className="text-[#ffb2b7] font-semibold">-{currency}{totalFixed.toLocaleString('es-ES')}</strong>
            </span>
            {totalMovementsIncome > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#222a3d] text-[#bbcabf] border border-white/5">
                Mov. Ingresos: <strong className="text-[#4edea3] font-semibold">+{currency}{totalMovementsIncome.toFixed(2)}</strong>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-[#222a3d] text-[#bbcabf] border border-white/5">
              Mov. Gastos: <strong className="text-[#ffb2b7] font-semibold">-{currency}{totalMovementsExpenses.toFixed(2)}</strong>
            </span>
            {totalSavingsDeducted > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#222a3d] text-[#4edea3] border border-[#4edea3]/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">savings</span>
                Ahorro: <strong className="text-[#4edea3] font-semibold">-{currency}{totalSavingsDeducted.toFixed(2)}</strong>
              </span>
            )}
          </div>

          {/* Barra de proporción de seguridad nórdica */}
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[#bbcabf] font-num text-[11px]">
              <span>Gastos Fijos Protegidos</span>
              <span className="text-[#4edea3] font-bold">
                {currency}{' '}
                {totalFixed.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                comprometido
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#2d3449] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4edea3] transition-all duration-700 shadow-[0_0_10px_rgba(78,222,163,0.5)]"
                style={{ width: `${Math.min(100, Math.max(10, cushionPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Indicador de Paz Mental Financiera */}
      <div className="rounded-2xl bg-[#171f33] p-4 shadow-lg border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#c0c1ff] border border-white/5">
              <span className="material-symbols-outlined text-[17px]">spa</span>
            </div>
            <span className="font-sans text-sm font-bold text-[#dae2fd]">
              Paz Mental Financiera
            </span>
          </div>
          <span className="font-num text-[11px] px-2 py-0.5 rounded bg-[#222a3d] text-[#bbcabf] font-medium">
            Ciclo en curso
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Métrica 1: Días del ciclo */}
          <div className="rounded-xl bg-[#131b2e] p-3 flex items-center gap-3 border border-white/5">
            <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#2d3449]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-[#c0c1ff]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Math.round((remainingDays / totalDaysInMonth) * 100)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-num text-xs text-white font-bold">
                {remainingDays}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-num text-[10px] text-[#bbcabf] uppercase">Días del ciclo</span>
              <span className="font-sans text-sm text-white font-bold truncate">
                {remainingDays} restantes
              </span>
              <span className="font-num text-[10px] text-[#c0c1ff]">
                Cierre: {totalDaysInMonth} {currentMonthName}
              </span>
            </div>
          </div>

          {/* Métrica 2: Límite Seguro Diario */}
          <div className="rounded-xl bg-[#131b2e] p-3 flex flex-col justify-between border border-white/5">
            <span className="font-num text-[10px] text-[#bbcabf] uppercase flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[13px] text-[#4edea3]">speed</span>
              Gasto seguro
            </span>
            <div className="my-0.5">
              <span className="font-num text-xl text-white font-bold">
                {currency}
                {safeDailySpend}
              </span>
              <span className="font-sans text-xs text-[#bbcabf]">/día</span>
            </div>
            <span className="font-sans text-[11px] text-[#4edea3] font-semibold">
              Sin tocar reservas
            </span>
          </div>
        </div>
      </div>

      {/* 4. Desglose Analítico Riguroso (Solo Lectura) */}
      <div className="rounded-2xl bg-[#171f33] p-4 shadow-lg border border-white/5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-1">
          <span className="font-num text-[11px] text-[#bbcabf] uppercase tracking-wider font-semibold">
            Desglose Analítico del Mes
          </span>
          <span className="font-sans text-xs text-[#86948a] flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px]">lock</span> Bloqueado
          </span>
        </div>

        {/* Fila 1: Ingresos Fijos */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#131b2e] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#4edea3] shrink-0">
                <span className="material-symbols-outlined text-[17px]">south_west</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-sm text-white font-semibold truncate">
                  Ingresos Fijos ({MONTH_NAMES_SHORT[selectedMonth - 1]})
                </span>
                <span className="font-sans text-[11px] text-[#bbcabf]">
                  {activeFixedIncomes.length} partidas activas en {MONTH_NAMES_FULL[selectedMonth - 1]}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-num text-sm text-[#4edea3] font-bold">
                +{currency}{' '}
                {totalFixedIncome.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          {inactiveFixedIncomes.length > 0 && (
            <div className="text-[10px] text-[#bbcabf] bg-[#0b1326] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/5">
              <span className="material-symbols-outlined text-[13px] text-[#4edea3]">info</span>
              <span>
                {inactiveFixedIncomes.length} ingreso(s) fijos programados para otros meses no computan en {MONTH_NAMES_FULL[selectedMonth - 1]}.
              </span>
            </div>
          )}
        </div>

        {/* Fila 2: Ingresos Registrados en Movimientos */}
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#131b2e] border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#4edea3] shrink-0">
              <span className="material-symbols-outlined text-[17px]">payments</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-sm text-white font-semibold truncate">
                Ingresos en Movimientos
              </span>
              <span className="font-sans text-[11px] text-[#bbcabf]">
                Ventas, devoluciones y extras registrados
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-num text-sm text-[#4edea3] font-bold">
              +{currency}{' '}
              {totalMovementsIncome.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Fila 3: Gastos Fijos Comprometidos */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#131b2e] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#ffb2b7] shrink-0">
                <span className="material-symbols-outlined text-[17px]">home_pin</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-sm text-white font-semibold truncate">
                  Gastos Fijos ({MONTH_NAMES_SHORT[selectedMonth - 1]})
                </span>
                <span className="font-sans text-[11px] text-[#bbcabf]">
                  {activeFixedExpenses.length} partidas activas en {MONTH_NAMES_FULL[selectedMonth - 1]}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-num text-sm text-[#dae2fd] font-bold">
                -{currency}{' '}
                {totalFixed.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          {inactiveFixedExpenses.length > 0 && (
            <div className="text-[10px] text-[#bbcabf] bg-[#0b1326] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/5">
              <span className="material-symbols-outlined text-[13px] text-[#ffb2b7]">schedule</span>
              <span>
                {inactiveFixedExpenses.length} gasto(s) fijo(s) programados para otros meses (ej. {inactiveFixedExpenses[0].name}) no computan en {MONTH_NAMES_FULL[selectedMonth - 1]}.
              </span>
            </div>
          )}
        </div>

        {/* Fila 4: Gastos Registrados en Movimientos */}
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#131b2e] border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center text-[#86948a] shrink-0">
              <span className="material-symbols-outlined text-[17px]">shopping_bag</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-sm text-white font-semibold truncate">
                Gastos en Movimientos
              </span>
              <span className="font-sans text-[11px] text-[#bbcabf]">
                Supermercado, cafetería, ocio, compras
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-num text-sm text-[#bbcabf] font-bold">
              -{currency}{' '}
              {totalMovementsExpenses.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Micro-estado de Serenidad Nórdica */}
      <div className="text-center py-2 px-4 flex flex-col items-center justify-center gap-1 opacity-80">
        <div className="flex items-center gap-1.5 text-[#bbcabf]">
          <span className="material-symbols-outlined text-[16px]">self_improvement</span>
          <span className="font-sans text-xs italic">
            "Tu capital trabaja con tranquilidad. No se requieren acciones hoy."
          </span>
        </div>
        <span className="font-num text-[#86948a] text-[10px] uppercase tracking-wider">
          CAPITALFOCUS AUTONOMOUS ENGINE • REVISIÓN AUTOMÁTICA A LAS 23:59
        </span>
      </div>
    </div>
  );
};
