export function formatDateFromAPI(dateStr: string | null): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}
