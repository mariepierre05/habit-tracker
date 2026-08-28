import React, { useState } from "react";
import { Cloud, CloudOff, LogOut } from "lucide-react";
import { BASE, PALETTE } from "./theme";
import { signIn, signUp, signOut } from "./sync";

const inputStyle = { background: BASE.paper, border: `1px solid ${BASE.line}`, color: BASE.ink, minHeight: 44 };

export default function SyncPanel({ session, syncedAt, onSignedIn, onSignedOut }) {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  async function submit(e) {
    e.preventDefault();
    setProblem("");
    setBusy(true);
    try {
      if (mode === "up") await signUp(email, password);
      else await signIn(email, password);
      setPassword("");
      onSignedIn();
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ background: PALETTE[1].tint, border: `1px solid ${PALETTE[1].soft}` }}>
        <div className="flex items-start gap-3">
          <Cloud size={18} color={PALETTE[1].deep} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">Synchronisation active</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: BASE.muted }}>{session.user.email}</p>
            <p className="text-xs mt-1" style={{ color: BASE.muted }}>
              {syncedAt ? `Dernière synchro à ${syncedAt}` : "En attente de la première synchro…"}
            </p>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); onSignedOut(); }}
          className="w-full rounded-xl mt-3 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          style={{ border: `1px solid ${BASE.line}`, color: BASE.ink, minHeight: 44 }}
        >
          <LogOut size={14} /> Se déconnecter de cet appareil
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-4 mb-3" style={{ background: BASE.paperDeep }}>
      <div className="flex items-start gap-3 mb-3">
        <CloudOff size={18} color={BASE.muted} className="shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: BASE.ink }}>
          Connecte-toi pour retrouver tes habitudes sur un autre appareil et garder une
          copie à l'abri. Tes données restent d'abord sur ce téléphone : la synchro se
          fait en arrière-plan, l'app marche toujours hors-ligne.
        </p>
      </div>

      <label className="block mb-2">
        <span className="block text-xs mb-1" style={{ color: BASE.muted }}>Adresse email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-3 outline-none"
          style={inputStyle}
        />
      </label>

      <label className="block mb-3">
        <span className="block text-xs mb-1" style={{ color: BASE.muted }}>Mot de passe</span>
        <input
          type="password"
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-3 outline-none"
          style={inputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
        style={{ background: PALETTE[1].deep, color: BASE.paper, minHeight: 44 }}
      >
        {busy ? "…" : mode === "up" ? "Créer mon compte" : "Se connecter"}
      </button>

      <button
        type="button"
        onClick={() => { setMode(mode === "up" ? "in" : "up"); setProblem(""); }}
        className="w-full mt-1 text-xs active:opacity-60 transition-opacity"
        style={{ color: BASE.muted, minHeight: 44 }}
      >
        {mode === "up" ? "J'ai déjà un compte" : "Créer un compte"}
      </button>

      {problem && <p className="text-xs mt-1" style={{ color: BASE.danger }}>{problem}</p>}
    </form>
  );
}
