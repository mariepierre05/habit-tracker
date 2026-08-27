// Dates are handled as local-time "YYYY-MM-DD" strings, never as Date objects
// in storage: an entry belongs to the day the user was living, not to a UTC
// instant that shifts across timezones.

export const DOW = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
export const DOW_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function pad(n) { return String(n).padStart(2, "0"); }

export function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function fromISO(iso) { return new Date(`${iso}T00:00:00`); }

export function dayOfWeek(iso) { return fromISO(iso).getDay(); }

// Oldest first, ending on `from`.
export function lastNDates(n, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    out.push(toISO(d));
  }
  return out;
}

export function shiftDays(iso, delta) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

// Weeks run Monday to Sunday, as they do in France.
export function startOfWeek(iso) {
  return shiftDays(iso, -((dayOfWeek(iso) + 6) % 7));
}

export function weekDates(iso) {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => shiftDays(start, i));
}

export function startOfMonth(iso) {
  const d = fromISO(iso);
  d.setDate(1);
  return toISO(d);
}

export function addMonths(iso, delta) {
  const d = fromISO(iso);
  // Set the day first: adding a month to the 31st would otherwise overflow.
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return toISO(d);
}

export function monthLabel(iso) {
  return fromISO(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// Flat list of cells for a Monday-first calendar month, padded with nulls at
// both ends so it tiles cleanly into seven columns.
export function monthCells(iso) {
  const first = fromISO(startOfMonth(iso));
  const year = first.getFullYear();
  const month = first.getMonth();
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = new Array(lead).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toISO(new Date(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
