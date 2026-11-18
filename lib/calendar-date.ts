export function localCalendarDate(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return {
    year,
    month,
    day,
    key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}
