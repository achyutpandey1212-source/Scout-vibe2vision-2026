export function formatDateFromAPI(dateStr: string | null | undefined): string | null {
  if (!dateStr || !dateStr.trim()) return null;

  // If it already matches DD/MM/YYYY, return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  // Handle YYYY/MM/DD format
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('/');
    return `${day}/${month}/${year}`;
  }

  // Fallback try parse
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Ignore
  }

  return dateStr;
}
