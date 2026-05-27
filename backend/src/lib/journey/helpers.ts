// Unix timestamp (seconds) → ISO string
export function formatUnixDate(unix?: number | string | null): string | undefined {
  if (unix == null || unix === "") return undefined;
  const ms = Number(unix) * 1000;
  if (isNaN(ms)) return undefined;
  return new Date(ms).toISOString();
}

// ISO / date string → ISO string (normalises timezone inconsistencies)
export function formatISODate(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

// Difference in whole days between two Date-compatible values (positive = b is later)
export function daysBetween(
  a: string | number | Date,
  b: string | number | Date = new Date(),
): number {
  const msA = typeof a === "object" ? a.getTime() : new Date(a).getTime();
  const msB = typeof b === "object" ? b.getTime() : new Date(b).getTime();
  return Math.floor((msB - msA) / (1000 * 60 * 60 * 24));
}

// Shift an ISO timestamp forward by N days
export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}