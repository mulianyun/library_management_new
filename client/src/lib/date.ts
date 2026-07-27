export function formatLocalDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isOverdueDate(dueDate: string, today = formatLocalDate(new Date())): boolean {
  return dueDate < today;
}
