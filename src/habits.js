import { DOW, lastNDates, fromISO, dayOfWeek, startOfWeek, shiftDays, weekDates } from "./dates";

export const FREQ_DAILY = "daily";
export const FREQ_WEEKDAYS = "weekdays";
export const FREQ_PER_WEEK = "perWeek";

export const DEFAULT_PERIODS = [
  { id: "matin", label: "Matin" },
  { id: "debut_am", label: "Début d'aprèm" },
  { id: "fin_am", label: "Fin d'aprèm" },
  { id: "soir", label: "Soirée" },
];

export const DEFAULT_HABITS = [
  { id: "water", name: "Boire 1,5 L d'eau", type: "count", target: 1.5, unit: "L", step: 0.25, icon: "droplet" },
  { id: "duolingo", name: "Séance Duolingo", type: "check", icon: "book" },
  { id: "muscu", name: "Renforcement musculaire", type: "check", icon: "dumbbell" },
  { id: "steps", name: "Marcher", type: "count", target: 8000, unit: "pas", step: 1000, icon: "footprints" },
  { id: "nosnack", name: "Sans grignotage", type: "multi", icon: "meal", subitems: DEFAULT_PERIODS },
];

// The app reads and accepts French notation, so it should display it too:
// 0,75 rather than 0.75, and 8 000 rather than 8000.
export function fmtNum(n) { return Number(n || 0).toLocaleString("fr-FR"); }

// Increment size for the +/- buttons: roughly an eighth of the target, snapped
// to a value a person would actually count in. A flat target/8 rounded to 0 for
// the 1,5 L water habit and to 1250 for a 10 000 step one.
const NICE_STEPS = [0.25, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export function stepFor(target) {
  const t = Number(target) || 1;
  const ideal = t / 8;
  // A whole-number target counts whole things: no quarter-pages or quarter-cups.
  const candidates = Number.isInteger(t) ? NICE_STEPS.filter((n) => n >= 1) : NICE_STEPS;
  return candidates.reduce((best, n) => (Math.abs(n - ideal) < Math.abs(best - ideal) ? n : best), candidates[0]);
}

export function isDone(habit, value) {
  if (habit.type === "multi") {
    if (!value) return false;
    return habit.subitems.every((s) => value[s.id] === true);
  }
  if (value === undefined || value === null) return false;
  if (habit.type === "check") return value === true;
  return Number(value) >= habit.target;
}

export function countDone(habit, value) {
  if (habit.type !== "multi") return isDone(habit, value) ? 1 : 0;
  if (!value) return 0;
  return habit.subitems.filter((s) => value[s.id] === true).length;
}

// Habits saved before frequencies existed have no `freq` and are daily.
export function freqKind(habit) {
  return (habit.freq && habit.freq.kind) || FREQ_DAILY;
}

// Whether the habit is asked for on a given day. A "3× per week" habit is
// never asked for on a specific day — it can be logged whenever suits.
export function isScheduled(habit, iso) {
  if (freqKind(habit) !== FREQ_WEEKDAYS) return true;
  return (habit.freq.days || []).includes(dayOfWeek(iso));
}

// Weekly habits are judged over the week, so they stay out of the daily tally.
export function countsTowardDay(habit) {
  return freqKind(habit) !== FREQ_PER_WEEK;
}

export function isRequiredOn(habit, iso) {
  return countsTowardDay(habit) && isScheduled(habit, iso);
}

export function weekTarget(habit) {
  return Math.max(1, Number(habit.freq && habit.freq.times) || 1);
}

export function weekDoneCount(habit, entries, iso) {
  return weekDates(iso).filter((d) => isDone(habit, (entries[d] || {})[habit.id])).length;
}

export function freqLabel(habit) {
  const kind = freqKind(habit);
  if (kind === FREQ_PER_WEEK) return `${weekTarget(habit)}× / semaine`;
  if (kind === FREQ_WEEKDAYS) {
    const days = habit.freq.days || [];
    if (days.length === 0) return "aucun jour";
    if (days.length === 7) return null;
    // Sorted Monday-first rather than by the Sunday-based index.
    return days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DOW[d]).join(" · ");
  }
  return null;
}

// Consecutive weeks that met their target. The current week is still open, so
// falling short of the target today doesn't end the streak yet.
function weekStreak(habit, entries, today) {
  const target = weekTarget(habit);
  let count = 0;
  let start = startOfWeek(today);
  for (let i = 0; i < 104; i++) {
    if (weekDoneCount(habit, entries, start) >= target) count++;
    else if (i > 0) break;
    start = shiftDays(start, -7);
  }
  return count;
}

// Consecutive scheduled days that were done. Days the habit isn't asked for
// are skipped rather than treated as misses, so a Mon/Wed/Fri habit keeps its
// streak over the weekend.
export function streakFor(habit, entries, today) {
  if (freqKind(habit) === FREQ_PER_WEEK) return weekStreak(habit, entries, today);
  let count = 0;
  for (const d of lastNDates(180, fromISO(today)).reverse()) {
    if (!isScheduled(habit, d)) continue;
    const done = isDone(habit, (entries[d] || {})[habit.id]);
    if (d === today && !done) continue;
    if (!done) break;
    count++;
  }
  return count;
}
