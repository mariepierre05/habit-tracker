import React, { useState } from "react";
import { X, Bell, CalendarPlus } from "lucide-react";
import { BASE, PALETTE } from "./theme";
import { getReminderTime, shareReminder } from "./reminder";

export default function ReminderSheet({ onClose }) {
  const [time, setTime] = useState(() => getReminderTime() || "20:00");
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState("");
  const existing = getReminderTime();

  async function add() {
    setProblem("");
    try {
      const result = await shareReminder(time, window.location.href);
      if (result === "cancelled") return;
      setStatus(
        result === "shared"
          ? "Choisis « Calendrier » dans le menu de partage pour ajouter le rappel."
          : "Fichier téléchargé — ouvre-le pour l'ajouter à ton agenda."
      );
    } catch (_) {
      setProblem("La création du rappel a échoué. Réessaie.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(58,52,44,0.35)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[28px] p-5 pb-8"
        style={{ background: BASE.paper, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Rappel quotidien</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-2 flex items-center justify-center active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: BASE.muted }}>
          Choisis une heure, et l'app crée un rappel quotidien dans ton agenda iPhone.
        </p>

        <label className="flex items-center justify-between rounded-2xl px-4 mb-3" style={{ background: BASE.paperDeep, minHeight: 56 }}>
          <span className="text-sm">Me rappeler à</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Heure du rappel"
            className="rounded-xl px-3 text-base outline-none"
            style={{ background: BASE.paper, border: `1px solid ${BASE.line}`, color: BASE.ink, minHeight: 44 }}
          />
        </label>

        <button
          onClick={add}
          className="w-full rounded-2xl mb-3 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: PALETTE[1].deep, color: BASE.paper, minHeight: 48 }}
        >
          <CalendarPlus size={16} /> {existing ? "Remplacer le rappel" : "Créer le rappel"}
        </button>

        {/* Said plainly rather than left as a surprise: the user asked for a
            notification, and this is deliberately not quite one. */}
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: PALETTE[2].tint, border: `1px solid ${PALETTE[2].soft}` }}>
          <Bell size={17} color={PALETTE[2].deep} className="shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed" style={{ color: BASE.ink }}>
            <p className="mb-2">
              <strong>Pourquoi l'agenda et pas une notification ?</strong>
            </p>
            <p className="mb-2">
              Une app web ne peut pas programmer elle-même une notification : sur iPhone, il faudrait
              un serveur qui l'envoie à l'heure dite, et cette app n'est faite que de fichiers statiques.
            </p>
            <p>
              Le rappel d'agenda, lui, sonne à l'heure même app fermée, et tu peux le modifier ou
              le supprimer depuis Calendrier quand tu veux.
            </p>
          </div>
        </div>

        {existing && (
          <p className="text-xs mt-4 text-center" style={{ color: BASE.muted }}>
            Dernier rappel créé pour {existing}. En créer un nouveau n'efface pas l'ancien —
            supprime-le depuis Calendrier si besoin.
          </p>
        )}

        {status && <p className="text-sm mt-4 text-center" style={{ color: PALETTE[1].deep }}>{status}</p>}
        {problem && <p className="text-sm mt-4 text-center" style={{ color: BASE.danger }}>{problem}</p>}
      </div>
    </div>
  );
}
