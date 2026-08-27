// All persistence goes through this module. Every function is async even
// though localStorage is synchronous, so that swapping the backend for a
// synced one (Supabase) later stays contained to this file — callers already
// await, and their code won't need to change shape.

const KEYS = {
  habits: "habits",
  entries: "entries",
  lastBackup: "lastBackup",
};

const BACKUP_FORMAT = 1;

// Private storage access. Reads never throw (a browser with site data blocked
// returns null and the app falls back to defaults); writes do, so callers can
// tell the user their change wasn't saved.
function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}
function write(key, value) {
  localStorage.setItem(key, value);
}

// Returns null when nothing usable is stored, so the caller can tell a first
// run from a real save and seed the defaults. Without that distinction the
// defaults would only live in memory and a backup taken before the first edit
// would export an empty habit list.
export async function loadHabits() {
  const raw = read(KEYS.habits);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

export async function saveHabits(habits) {
  write(KEYS.habits, JSON.stringify(habits));
}

export async function loadEntries() {
  const raw = read(KEYS.entries);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

export async function saveEntries(entries) {
  write(KEYS.entries, JSON.stringify(entries));
}

export async function getLastBackup() {
  return read(KEYS.lastBackup);
}

async function markBackedUp() {
  try {
    write(KEYS.lastBackup, new Date().toISOString());
  } catch (_) {
    // Losing the "last backup" date is harmless — don't fail the export over it.
  }
}

function backupFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `habitudes-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export async function buildBackup() {
  const [stored, entries] = await Promise.all([loadHabits(), loadEntries()]);
  const habits = stored || [];
  return JSON.stringify(
    {
      app: "habit-tracker",
      format: BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      habits,
      entries,
    },
    null,
    2
  );
}

// Returns "shared" | "downloaded" | "cancelled".
export async function exportBackup() {
  const json = await buildBackup();
  const filename = backupFilename();
  const type = "application/json";

  // An installed PWA on iOS can't complete an <a download>; the share sheet is
  // the reliable path there (Save to Files, Mail, AirDrop…).
  try {
    const file = new File([json], filename, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      await markBackedUp();
      return "shared";
    }
  } catch (err) {
    // The user dismissing the share sheet is not an error worth reporting.
    if (err && err.name === "AbortError") return "cancelled";
  }

  const url = URL.createObjectURL(new Blob([json], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  await markBackedUp();
  return "downloaded";
}

// Validates a backup file without writing anything, so the UI can show what
// it contains and let the user confirm before overwriting their data.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.");
  }
  if (!data || data.app !== "habit-tracker") {
    throw new Error("Ce fichier ne vient pas de cette application.");
  }
  if (!Array.isArray(data.habits) || !data.entries || typeof data.entries !== "object") {
    throw new Error("Cette sauvegarde est incomplète ou abîmée.");
  }
  return {
    habits: data.habits,
    entries: data.entries,
    exportedAt: data.exportedAt || null,
    habitCount: data.habits.length,
    dayCount: Object.keys(data.entries).length,
  };
}

export async function restoreBackup(parsed) {
  await saveHabits(parsed.habits);
  await saveEntries(parsed.entries);
}
