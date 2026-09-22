/**
 * Date Formatting Utility for Action Tailor
 * Avoids UTC timezone conversion shifts (Pakistan Time UTC+5)
 */

export function formatLocalDateInput(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateDisplay(d: Date | string | number | undefined | null): string {
  if (!d) return '-';
  const dateObj = typeof d === 'object' ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

