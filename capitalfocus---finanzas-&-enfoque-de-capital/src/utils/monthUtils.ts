export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Returns true if an item applies to the given 1-based month (1 = Enero, 12 = Diciembre).
 * If applicableMonths is undefined, null, or empty, it defaults to all months (1..12).
 */
export function isItemActiveInMonth(
  applicableMonths?: number[],
  month1to12: number = new Date().getMonth() + 1
): boolean {
  if (!applicableMonths || applicableMonths.length === 0 || applicableMonths.length === 12) {
    return true;
  }
  return applicableMonths.includes(month1to12);
}

/**
 * Formats the applicable months into human-readable Spanish text.
 */
export function formatApplicableMonths(applicableMonths?: number[]): string {
  if (!applicableMonths || applicableMonths.length === 0 || applicableMonths.length === 12) {
    return 'Todos los meses';
  }
  if (applicableMonths.length === 1) {
    return `Solo ${MONTH_NAMES_FULL[applicableMonths[0] - 1]}`;
  }
  if (applicableMonths.length <= 4) {
    return applicableMonths
      .slice()
      .sort((a, b) => a - b)
      .map((m) => MONTH_NAMES_SHORT[m - 1])
      .join(', ');
  }
  return `${applicableMonths.length} meses seleccionados`;
}

/**
 * Returns full status information for an item in a specific month
 */
export function getMonthStatusInfo(
  applicableMonths?: number[],
  month1to12: number = new Date().getMonth() + 1
): {
  isActive: boolean;
  label: string;
  isAllMonths: boolean;
  monthNamesText: string;
} {
  const isAllMonths = !applicableMonths || applicableMonths.length === 0 || applicableMonths.length === 12;
  const isActive = isItemActiveInMonth(applicableMonths, month1to12);
  const targetMonthName = MONTH_NAMES_FULL[month1to12 - 1];

  let label = 'Todos los meses';
  if (!isAllMonths && applicableMonths) {
    if (applicableMonths.length === 1) {
      label = MONTH_NAMES_FULL[applicableMonths[0] - 1];
    } else {
      label = applicableMonths
        .slice()
        .sort((a, b) => a - b)
        .map((m) => MONTH_NAMES_SHORT[m - 1])
        .join(', ');
    }
  }

  return {
    isActive,
    label,
    isAllMonths,
    monthNamesText: isAllMonths ? 'Todos los meses' : `Aplica en: ${label}`,
  };
}
