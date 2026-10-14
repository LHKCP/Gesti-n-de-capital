import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '../types/finance';
import { playKeypadTone, playSuccessChime, triggerHaptic, triggerConfetti } from '../utils/feedback';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onResetMonth: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onResetMonth,
}) => {
  const currency = '€';
  // Input states
  const [movementType, setMovementType] = useState<'expense' | 'income'>('expense');
  const [amountInput, setAmountInput] = useState<string>('');
  const [conceptInput, setConceptInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Otros');
  const [selectedIcon, setSelectedIcon] = useState<string>('receipt');
  
  // Date ribbon state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(todayStr);
  const [filterMode, setFilterMode] = useState<'all' | 'selectedDay'>('all');
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  // Optimistic toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit modal state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Reset month modal state
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Current month name
  const currentMonthName = useMemo(() => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return monthNames[new Date().getMonth()];
  }, []);

  // Generate 7-day horizontal ribbon centered around today
  const ribbonDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let offset = -4; offset <= 2; offset++) {
      const d = new Date(now);
      d.setDate(now.getDate() + offset);
      const iso = d.toISOString().split('T')[0];
      const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      const dayName = offset === 0 ? 'HOY' : dayNames[d.getDay()];
      const dayNum = d.getDate();
      days.push({
        iso,
        label: dayName,
        number: dayNum,
        isToday: offset === 0,
      });
    }
    return days;
  }, []);

  // Frequent quick concept categories
  const frequentConcepts = [
    { label: 'Supermercado', icon: 'local_grocery_store', color: 'text-[#4edea3]' },
    { label: 'Cafetería', icon: 'coffee', color: 'text-[#ffb2b7]' },
    { label: 'Transporte', icon: 'directions_subway', color: 'text-[#c0c1ff]' },
    { label: 'Restaurante', icon: 'restaurant', color: 'text-[#6ffbbe]' },
    { label: 'Farmacia', icon: 'medication', color: 'text-[#ffb4ab]' },
    { label: 'Ocio', icon: 'sports_esports', color: 'text-[#e1e0ff]' },
  ];

  // Calculate monthly variable expenses and income
  const totalVariableExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalVariableIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const expensesCount = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').length;
  }, [transactions]);

  // Filter transactions based on date ribbon or mode
  const displayedTransactions = useMemo(() => {
    if (filterMode === 'selectedDay') {
      return transactions.filter((t) => t.dateStr === selectedDateFilter);
    }
    return transactions;
  }, [transactions, filterMode, selectedDateFilter]);

  // Group transactions by date for aesthetic feed
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    for (const tx of displayedTransactions) {
      if (!groups[tx.dateStr]) {
        groups[tx.dateStr] = [];
      }
      groups[tx.dateStr].push(tx);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [displayedTransactions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleQuickConcept = (concept: { label: string; icon: string }) => {
    playKeypadTone(620, 20);
    triggerHaptic(8);
    setConceptInput(concept.label);
    setSelectedCategory(concept.label);
    setSelectedIcon(concept.icon);
  };

  const handleRegister = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerHaptic(20);
      playKeypadTone(260, 40);
      return;
    }

    const finalConcept = conceptInput.trim() || 'Otros';
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    // Optimistic mutation call
    onAddTransaction({
      type: movementType,
      amount: parsedAmount,
      concept: finalConcept,
      category: selectedCategory || 'Otros',
      dateStr: selectedDateFilter,
      timeStr,
      icon: selectedIcon,
      currency,
    });

    playSuccessChime();
    triggerHaptic(15);
    if (movementType === 'income') {
      triggerConfetti();
    }

    showToast(
      `Guardado: ${finalConcept} (${movementType === 'expense' ? '-' : '+'}${currency}${parsedAmount.toFixed(2)})`
    );

    // Reset inputs
    setAmountInput('');
    setConceptInput('');
    setSelectedCategory('Otros');
    setSelectedIcon('receipt');
  };

  return (
    <div className="w-full flex flex-col gap-5 max-w-lg mx-auto pb-10">
      {/* 1. Bento Card Principal: Gasto Total Actual del Mes */}
      <section className="bg-[#171f33] rounded-2xl p-4 shadow-lg border border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#bbcabf]">
            <div className="w-7 h-7 rounded-lg bg-[#ff7886]/15 flex items-center justify-center text-[#ff7886]">
              <span
                className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <span className="font-num text-[11px] uppercase tracking-wider font-semibold text-[#dae2fd]">
              Gasto Total Actual • {currentMonthName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-num text-[11px] bg-[#222a3d] px-2.5 py-0.5 rounded-full text-[#bbcabf] font-semibold border border-white/5">
              {expensesCount} {expensesCount === 1 ? 'movimiento' : 'movimientos'}
            </span>
            <button
              type="button"
              onClick={() => {
                playKeypadTone(500, 15);
                setShowResetConfirmModal(true);
              }}
              className="flex items-center gap-1 font-sans text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#ff7886]/15 hover:bg-[#ff7886]/25 text-[#ffb2b7] border border-[#ff7886]/30 transition-all active:scale-95 shadow-sm"
              title="Resetear movimientos variables del mes"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              <span>Resetear Mes</span>
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-3">
          <div>
            <div className="flex items-baseline gap-1 text-[#dae2fd]">
              <span className="font-sans text-xl font-bold text-[#ff7886]">{currency}</span>
              <span className="font-num text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {totalVariableExpense.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="font-sans text-xs text-[#bbcabf] mt-1">
              Gasto total acumulado registrado durante {currentMonthName}.
            </p>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#222a3d] text-[#ff7886] border border-white/5 shadow-inner">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
        </div>
      </section>

      {/* 2. Módulo de Registro Rápido */}
      <section className="bg-[#131b2e] rounded-2xl p-4 shadow-xl border border-white/5 flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex items-center p-1 bg-[#060e20] rounded-xl gap-1 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMovementType('expense');
              playKeypadTone(480, 15);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans text-sm font-bold transition-all duration-200 ${
              movementType === 'expense'
                ? 'bg-[#ff7886] text-[#780021] shadow-md'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            <span>Gasto</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMovementType('income');
              playKeypadTone(650, 15);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans text-sm font-bold transition-all duration-200 ${
              movementType === 'income'
                ? 'bg-[#4edea3] text-[#003824] shadow-md'
                : 'text-[#bbcabf] hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            <span>Ingreso</span>
          </button>
        </div>

        {/* Amount input & Floating currency selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-num text-[11px] uppercase text-[#bbcabf] tracking-wider font-semibold">
              Monto del Movimiento
            </label>
            {/* Fixed Currency indicator */}
            <div className="flex items-center gap-1 bg-[#171f33] px-2 py-0.5 rounded-full border border-white/5">
              <span className="font-num text-[10px] text-[#4edea3] font-bold">EUR (€)</span>
            </div>
          </div>

          <div className="relative flex items-center bg-[#2d3449]/70 rounded-xl px-4 py-3 border border-white/5 focus-within:border-[#4edea3] transition-colors">
            <span className="font-num text-2xl text-[#bbcabf] mr-2 select-none font-bold">
              {currency}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setAmountInput(val);
              }}
              placeholder="0.00"
              className="w-full bg-transparent font-num text-2xl text-[#dae2fd] focus:outline-none placeholder:text-[#86948a] font-bold tracking-tight"
            />
            {amountInput && (
              <button
                type="button"
                onClick={() => setAmountInput('')}
                className="text-[#bbcabf] hover:text-white p-1"
                title="Limpiar"
              >
                <span className="material-symbols-outlined text-[18px]">backspace</span>
              </button>
            )}
          </div>
        </div>

        {/* Concept input and Quick category chips */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-num text-[11px] uppercase text-[#bbcabf] tracking-wider font-semibold">
              Concepto o Categoría
            </label>
            <span className="font-num text-[10px] text-[#86948a] bg-[#222a3d] px-2 py-0.5 rounded">
              Vacío = "Otros"
            </span>
          </div>

          <div className="flex items-center bg-[#2d3449]/70 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-[#4edea3]">
            <span className="material-symbols-outlined text-[#86948a] mr-2 text-[20px]">
              edit_note
            </span>
            <input
              type="text"
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              placeholder="Ej. Almuerzo rápido, Café..."
              className="w-full bg-transparent font-sans text-sm text-[#dae2fd] focus:outline-none placeholder:text-[#86948a]"
            />
          </div>

          {/* Horizontal scrollable chips for frequent concepts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {frequentConcepts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickConcept(item)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 border border-white/5 active:scale-95 ${
                  conceptInput === item.label
                    ? 'bg-[#4edea3] text-[#003824] font-bold shadow-md'
                    : 'bg-[#222a3d] text-[#dae2fd] hover:bg-[#2d3449]'
                }`}
              >
                <span className={`material-symbols-outlined text-[15px] ${item.color}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Selector de Fecha Horizontal (LazyRow / Cinta desplazable) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-num text-[11px] uppercase text-[#bbcabf] tracking-wider font-semibold">
              Fecha del Registro (Cinta Desplazable)
            </span>
            {filterMode === 'selectedDay' && (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="text-[11px] text-[#4edea3] hover:underline font-num"
              >
                Mostrar Todos
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {ribbonDays.map((day) => {
              const isSelected = selectedDateFilter === day.iso;
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDateFilter(day.iso);
                    setFilterMode('selectedDay');
                    playKeypadTone(540, 15);
                    triggerHaptic(8);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-1 rounded-xl transition-all duration-200 border border-white/5 flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#4edea3] text-[#003824] font-bold shadow-lg scale-105'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#2d3449] hover:text-white'
                  }`}
                >
                  <span className="font-num text-[10px] tracking-wider uppercase">
                    {day.label}
                  </span>
                  <span className="font-num text-sm font-semibold">{day.number}</span>
                </button>
              );
            })}

            {/* Global Calendar Picker button */}
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="flex flex-col items-center justify-center min-w-[48px] h-[52px] rounded-xl bg-[#2d3449] text-[#4edea3] hover:bg-[#31394d] border border-white/5 transition-all flex-shrink-0 shadow-sm"
              title="Abrir calendario"
            >
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </button>
          </div>
        </div>

        {/* 5. Fast Submit button with optimistic trigger */}
        <div className="flex flex-col gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleRegister()}
            className="w-full h-12 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-sans font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
          >
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            <span>
              Registrar {movementType === 'expense' ? 'Gasto' : 'Ingreso'}
            </span>
          </button>
          <div className="flex items-center justify-center gap-1 text-[#bbcabf] pt-1">
            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">verified</span>
            <span className="font-sans text-xs text-[#86948a]">
              Guardado instantáneo y sincronización local
            </span>
          </div>
        </div>
      </section>

      {/* 6. Historial Reciente y Listado Grouped */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-bold text-[#dae2fd]">Historial Reciente</h2>
            <span className="bg-[#222a3d] text-[#dae2fd] font-num text-xs px-2.5 py-0.5 rounded-full font-bold">
              {displayedTransactions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterMode(filterMode === 'all' ? 'selectedDay' : 'all');
              }}
              className="font-sans text-xs text-[#4edea3] hover:underline flex items-center gap-0.5"
            >
              <span>{filterMode === 'selectedDay' ? 'Ver todo' : 'Filtrar por día'}</span>
              <span className="material-symbols-outlined text-[16px]">tune</span>
            </button>
          </div>
        </div>

        {/* Grouped lists */}
        {groupedTransactions.length === 0 ? (
          <div className="bg-[#171f33] rounded-2xl p-6 text-center text-[#bbcabf] border border-white/5">
            <span className="material-symbols-outlined text-[32px] text-[#86948a] mb-2">
              receipt_long
            </span>
            <p className="font-sans text-sm">No hay transacciones registradas para este filtro.</p>
          </div>
        ) : (
          groupedTransactions.map(([dateKey, items]) => {
            const isToday = dateKey === todayStr;
            const dayNet = items.reduce(
              (sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount),
              0
            );

            return (
              <div key={dateKey} className="flex flex-col gap-2">
                {/* Header for group */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-num uppercase tracking-wider text-[#bbcabf] font-semibold">
                    {isToday ? 'Hoy' : dateKey}
                  </span>
                  <span
                    className={`font-num font-semibold ${
                      dayNet >= 0 ? 'text-[#4edea3]' : 'text-[#ffb2b7]'
                    }`}
                  >
                    {dayNet >= 0 ? '+' : ''}
                    {currency}
                    {dayNet.toFixed(2)} {dayNet >= 0 ? 'Neto' : ''}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  {items.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const amountColor = isExpense ? 'text-[#ffb2b7]' : 'text-[#4edea3]';
                    const sign = isExpense ? '-' : '+';

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-[#171f33] rounded-xl border border-white/5 shadow-sm transition-all hover:bg-[#222a3d] group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg bg-[#222a3d] flex items-center justify-center ${amountColor} flex-shrink-0 border border-white/5`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {tx.icon || 'receipt'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-sm font-semibold text-[#dae2fd] truncate">
                              {tx.concept}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs text-[#bbcabf]">
                                {tx.timeStr}
                              </span>
                              <span className="font-num text-[10px] bg-[#222a3d] text-[#86948a] px-1.5 py-0.5 rounded">
                                {tx.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className={`font-num text-sm font-bold ${amountColor}`}>
                            {sign}
                            {currency}
                            {tx.amount.toFixed(2)}
                          </span>

                          <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setEditingTx(tx)}
                              className="p-1 rounded text-[#86948a] hover:text-white transition-colors"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                triggerHaptic(10);
                                showToast(`Eliminado: ${tx.concept}`);
                              }}
                              className="p-1 rounded text-[#86948a] hover:text-[#ff7886] transition-colors"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Swipe hint */}
        <div className="flex items-center justify-center gap-1.5 text-[#bbcabf] py-2">
          <span className="material-symbols-outlined text-[16px] text-[#86948a]">swipe_left</span>
          <span className="font-sans text-xs text-[#86948a]">
            Toca editar o borrar para gestionar tus transacciones
          </span>
        </div>
      </section>

      {/* Optimistic Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 flex items-center justify-between p-3.5 bg-[#10b981] text-[#003824] rounded-xl shadow-2xl animate-fadeIn border border-white/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] font-bold">check_circle</span>
            <span className="font-sans text-sm font-bold truncate">{toastMessage}</span>
          </div>
          <span className="font-num text-[10px] uppercase bg-black/20 px-2 py-0.5 rounded text-white font-bold ml-2 flex-shrink-0">
            Offline Sync
          </span>
        </div>
      )}

      {/* Global Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#4edea3]">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <h3 className="font-sans text-base font-bold text-white">Seleccionar Fecha</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <input
              type="date"
              defaultValue={selectedDateFilter}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateFilter(e.target.value);
                  setFilterMode('selectedDay');
                  setShowCalendarModal(false);
                  playKeypadTone(500, 15);
                }
              }}
              className="w-full bg-[#0b1326] border border-white/10 rounded-xl px-4 py-3 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
            />

            <button
              type="button"
              onClick={() => {
                setSelectedDateFilter(todayStr);
                setFilterMode('selectedDay');
                setShowCalendarModal(false);
              }}
              className="py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-colors"
            >
              Ir a Hoy
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-white">Editar Movimiento</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-[#bbcabf] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEditTransaction(editingTx);
                setEditingTx(null);
                showToast(`Actualizado: ${editingTx.concept}`);
                playSuccessChime();
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="text-xs text-[#bbcabf] font-num">Concepto</label>
                <input
                  type="text"
                  value={editingTx.concept}
                  onChange={(e) => setEditingTx({ ...editingTx, concept: e.target.value })}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Monto ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTx.amount}
                  onChange={(e) =>
                    setEditingTx({
                      ...editingTx,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 font-num text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="text-xs text-[#bbcabf] font-num">Categoría</label>
                <input
                  type="text"
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                  className="w-full mt-1 bg-[#0b1326] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#222a3d] text-xs font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4edea3] text-[#003824] text-xs font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Month Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff7886]/20 border border-[#ff7886]/30 flex items-center justify-center text-[#ff7886] shrink-0">
                <span className="material-symbols-outlined text-[24px]">restart_alt</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-sans text-base font-bold text-white">¿Resetear Mes en Curso?</h3>
                <span className="font-num text-[11px] text-[#ffb2b7] uppercase tracking-wider font-semibold">
                  Apartado Movimientos
                </span>
              </div>
            </div>

            <div className="bg-[#0b1326] rounded-xl p-3 border border-white/5 flex flex-col gap-2 text-xs text-[#bbcabf]">
              <p className="leading-relaxed">
                Esta acción eliminará todos los <strong className="text-white">gastos e ingresos variables</strong> registrados en la lista de Movimientos (<strong className="text-[#ffb2b7]">{transactions.length} transacciones</strong>) para dejar el historial del mes limpio.
              </p>
              <div className="flex items-center gap-1.5 text-[#4edea3] pt-1 border-t border-white/5 font-sans">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Tus ingresos fijos, gastos fijos, metas de ahorro y deudas se mantendrán intactos.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#222a3d] hover:bg-[#2d3449] text-xs font-semibold text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetMonth();
                  setShowResetConfirmModal(false);
                  triggerHaptic(20);
                  playSuccessChime();
                  showToast('Mes reseteado con éxito. Movimientos variables en cero.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ff7886] hover:bg-[#ff8f9a] text-[#780021] text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Sí, resetear mes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
