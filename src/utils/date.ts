/** Format ISO date string (YYYY-MM-DD) to dd/mm/yyyy */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Check if an ISO date string is in the past */
export function isPast(iso: string): boolean {
  return new Date(iso) < new Date(new Date().toDateString());
}

/** Check if an ISO date string is today or in the future */
export function isFutureOrToday(iso: string): boolean {
  return !isPast(iso);
}
