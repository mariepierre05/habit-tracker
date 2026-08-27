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

export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
