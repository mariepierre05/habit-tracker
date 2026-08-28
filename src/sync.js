import { supabase } from "./supabase";
import { setLocalModifiedAt } from "./storage";

// Sync is deliberately additive. The device stays the source of truth for
// everything the app reads and writes, so it opens instantly and works offline
// exactly as before; this module only mirrors that state to the server and
// decides, once at startup, which of the two is more recent.
//
// The whole state travels as one document. For one person on one or two
// devices that is predictable — the newer side wins outright — and there is no
// half-merged result to explain. Splitting it per habit would buy finer
// conflict resolution that nobody here would ever exercise.

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session || null));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(translate(error.message));
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(translate(error.message));
  // With email confirmation switched off the session arrives immediately; if it
  // is ever switched back on, there is no session and the address needs
  // confirming first — worth saying rather than failing silently.
  if (!data.session) throw new Error("Compte créé. Confirme ton adresse par email, puis connecte-toi.");
}

export async function signOut() {
  await supabase.auth.signOut();
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user ? data.user.id : null;
}

export async function fetchState() {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("app_state")
    .select("habits, entries, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function pushState(habits, entries) {
  const userId = await currentUserId();
  if (!userId) return null;
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("app_state")
    .upsert({ user_id: userId, habits, entries, updated_at: updatedAt });
  if (error) throw error;
  // Local and server now hold the same thing; aligning the stamp stops the next
  // startup from treating this device as stale.
  setLocalModifiedAt(updatedAt);
  return updatedAt;
}

// Returns { action: "pulled", habits, entries } when the server was ahead,
// or { action: "pushed" } when this device was.
export async function reconcile(habits, entries, localModifiedAt) {
  const remote = await fetchState();
  if (!remote) {
    await pushState(habits, entries);
    return { action: "pushed" };
  }
  const remoteTime = new Date(remote.updated_at).getTime();
  const localTime = localModifiedAt ? new Date(localModifiedAt).getTime() : 0;
  if (remoteTime > localTime) {
    setLocalModifiedAt(remote.updated_at);
    return { action: "pulled", habits: remote.habits, entries: remote.entries };
  }
  await pushState(habits, entries);
  return { action: "pushed" };
}

// Rows dropped in by an iOS Shortcut. They are folded into the local entries
// and deleted, so an automation never has to read the existing state first.
export async function drainInbox(entries) {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("inbox")
    .select("id, day, habit_id, value")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const next = { ...entries };
  for (const row of data) {
    next[row.day] = { ...(next[row.day] || {}), [row.habit_id]: row.value };
  }
  await supabase.from("inbox").delete().in("id", data.map((r) => r.id));
  return next;
}

function translate(message) {
  const m = String(message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Adresse ou mot de passe incorrect.";
  if (m.includes("user already registered")) return "Un compte existe déjà pour cette adresse. Connecte-toi.";
  if (m.includes("password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Cette adresse email n'est pas valide.";
  if (m.includes("signups not allowed")) return "Les inscriptions sont fermées sur ce projet.";
  return message;
}
