import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check, Plus, Trash2, Flame, X, Minus, Download, Upload, Shield, CalendarClock, RotateCcw, Pencil, Moon } from "lucide-react";
import { loadHabits, saveHabits as persistHabits, loadEntries, saveEntries as persistEntries, exportBackup, parseBackup, restoreBackup, getLastBackup } from "./storage";
import { BASE, PALETTE, colorFor, iconFor } from "./theme";
import { DOW, toISO, lastNDates, dayOfYear, fromISO } from "./dates";
import {
  DEFAULT_HABITS, isDone, countDone, streakFor, fmtNum,
  isScheduled, isRequiredOn, countsTowardDay, freqLabel, freqKind,
  weekDoneCount, weekTarget, FREQ_PER_WEEK,
} from "./habits";
import HabitForm from "./HabitForm";

// Traditional French "fête du jour" calendar — [firstName, "Saint"/"Sainte"/""] per day, per month (Jan→Dec).
const FETE_DATA = [
  [["Jour de l'An", ""], ["Basile", "Saint"], ["Geneviève", "Sainte"], ["Odilon", "Saint"], ["Edouard", "Saint"], ["Mélaine", "Saint"], ["Raymond", "Saint"], ["Lucien", "Saint"], ["Alix", "Sainte"], ["Guillaume", "Saint"], ["Pauline", "Sainte"], ["Tatiana", "Sainte"], ["Yvette", "Sainte"], ["Nina", "Sainte"], ["Rémi", "Saint"], ["Marcel", "Saint"], ["Roseline", "Sainte"], ["Prisca", "Sainte"], ["Marius", "Saint"], ["Sébastien", "Saint"], ["Agnès", "Sainte"], ["Vincent", "Saint"], ["Barnard", "Saint"], ["François de Sales", "Saint"], ["Conversion de Paul", ""], ["Paule", "Sainte"], ["Angèle", "Sainte"], ["Thomas d'Aquin", "Saint"], ["Gildas", "Saint"], ["Martine", "Sainte"], ["Marcelle", "Sainte"]],
  [["Ella", "Sainte"], ["Présentation de Jésus", ""], ["Blaise", "Saint"], ["Véronique", "Sainte"], ["Agathe", "Sainte"], ["Gaston", "Saint"], ["Eugénie", "Sainte"], ["Jacqueline", "Sainte"], ["Apolline", "Sainte"], ["Arnaud", "Saint"], ["Notre-Dame de Lourdes", "Sainte"], ["Félix", "Saint"], ["Béatrice", "Sainte"], ["Valentin", "Saint"], ["Claude", "Saint"], ["Julienne", "Sainte"], ["Alexis", "Saint"], ["Bernadette", "Sainte"], ["Gabin", "Saint"], ["Aimée", "Sainte"], ["Mercredi des Cendres", ""], ["Isabelle", "Sainte"], ["Lazare", "Saint"], ["Modeste", "Sainte"], ["Roméo", "Saint"], ["Nestor", "Saint"], ["Honorine", "Sainte"], ["Romain", "Saint"], ["Auguste", "Saint"]],
  [["Aubin", "Saint"], ["Charles le Bon", "Saint"], ["Guénolé", "Saint"], ["Casimir", "Saint"], ["Olive", "Sainte"], ["Colette", "Sainte"], ["Félicité", "Sainte"], ["Jean de Dieu", "Saint"], ["Françoise", "Sainte"], ["Vivien", "Saint"], ["Rosine", "Sainte"], ["Justine", "Sainte"], ["Rodrigue", "Saint"], ["Mathilde", "Sainte"], ["Louise", "Sainte"], ["Bénédicte", "Sainte"], ["Patrice", "Saint"], ["Cyrille", "Saint"], ["Joseph", "Saint"], ["Herbert", "Saint"], ["Clémence", "Sainte"], ["Léa", "Sainte"], ["Victorien", "Saint"], ["Karine", "Sainte"], ["Anne", "Sainte"], ["Larissa", "Sainte"], ["Habib", "Saint"], ["Gontran", "Saint"], ["Gwladys", "Sainte"], ["Amédée", "Saint"], ["Benjamin", "Saint"]],
  [["Hugues", "Saint"], ["Sandrine", "Sainte"], ["Richard", "Saint"], ["Isidore", "Saint"], ["Irène", "Sainte"], ["Marcellin", "Saint"], ["Jean-Baptiste de la Salle", "Saint"], ["Julie", "Sainte"], ["Gautier", "Saint"], ["Fulbert", "Saint"], ["Stanislas", "Saint"], ["Jules", "Saint"], ["Ida", "Sainte"], ["Maxime", "Saint"], ["Paterne", "Saint"], ["Benoît-Joseph", "Saint"], ["Anicet", "Saint"], ["Parfait", "Saint"], ["Emma", "Sainte"], ["Odette", "Sainte"], ["Anselme", "Saint"], ["Alexandre", "Saint"], ["Georges", "Saint"], ["Fidèle", "Saint"], ["Marc", "Saint"], ["Alida", "Sainte"], ["Zita", "Sainte"], ["Valérie", "Sainte"], ["Catherine de Sienne", "Sainte"], ["Robert", "Saint"]],
  [["Fête du Travail", ""], ["Boris", "Saint"], ["Philippe", "Saint"], ["Sylvain", "Saint"], ["Judith", "Sainte"], ["Prudence", "Sainte"], ["Gisèle", "Sainte"], ["Victoire 1945", ""], ["Pacôme", "Saint"], ["Solange", "Sainte"], ["Estelle", "Sainte"], ["Achille", "Saint"], ["Rolande", "Sainte"], ["Matthias", "Saint"], ["Denise", "Sainte"], ["Honoré", "Saint"], ["Pascal", "Saint"], ["Eric", "Saint"], ["Yves", "Saint"], ["Bernardin", "Saint"], ["Constantin", "Saint"], ["Emile", "Saint"], ["Didier", "Saint"], ["Donatien", "Saint"], ["Sophie", "Sainte"], ["Bérenger", "Saint"], ["Augustin", "Saint"], ["Germain", "Saint"], ["Aymar", "Saint"], ["Ferdinand", "Saint"], ["Visitation de Marie", ""]],
  [["Justin", "Saint"], ["Blandine", "Sainte"], ["Kévin", "Saint"], ["Clotilde", "Sainte"], ["Igor", "Saint"], ["Norbert", "Saint"], ["Gilbert", "Saint"], ["Médard", "Saint"], ["Diane", "Sainte"], ["Landry", "Saint"], ["Barnabé", "Saint"], ["Guy", "Saint"], ["Antoine de Padoue", "Saint"], ["Elisée", "Saint"], ["Germaine", "Sainte"], ["Jean-François Régis", "Saint"], ["Hervé", "Saint"], ["Léonce", "Saint"], ["Romuald", "Saint"], ["Silvère", "Saint"], ["Rodolphe", "Saint"], ["Alban", "Saint"], ["Audrey", "Sainte"], ["Jean-Baptiste", "Saint"], ["Prosper", "Saint"], ["Anthelme", "Saint"], ["Fernand", "Saint"], ["Irénée", "Saint"], ["Pierre, Paul", "Saints"], ["Martial", "Saint"]],
  [["Thierry", "Saint"], ["Martinien", "Saint"], ["Thomas", "Saint"], ["Florent", "Saint"], ["Antoine", "Saint"], ["Mariette", "Sainte"], ["Raoul", "Saint"], ["Thibault", "Saint"], ["Amandine", "Sainte"], ["Ulrich", "Saint"], ["Benoît", "Saint"], ["Olivier", "Saint"], ["Henri, Joël", "Saint"], ["Fête Nationale", ""], ["Donald", "Saint"], ["Notre-Dame du Mont Carmel", ""], ["Charlotte", "Sainte"], ["Frédéric", "Saint"], ["Arsène", "Saint"], ["Marina", "Sainte"], ["Victor", "Saint"], ["Marie-Madeleine", "Sainte"], ["Brigitte", "Sainte"], ["Christine", "Sainte"], ["Jacques", "Saint"], ["Anne, Joachim", "Sainte"], ["Nathalie", "Sainte"], ["Samson", "Saint"], ["Marthe", "Sainte"], ["Juliette", "Sainte"], ["Ignace de Loyola", "Saint"]],
  [["Alphonse", "Saint"], ["Julien Eymard", "Saint"], ["Lydie", "Sainte"], ["Jean-Marie Vianney", "Saint"], ["Abel", "Saint"], ["Transfiguration", ""], ["Gaétan", "Saint"], ["Dominique", "Saint"], ["Amour", "Saint"], ["Laurent", "Saint"], ["Claire", "Sainte"], ["Clarisse", "Sainte"], ["Hippolyte", "Saint"], ["Evrard", "Saint"], ["Assomption", ""], ["Armel", "Saint"], ["Hyacinthe", "Saint"], ["Hélène", "Sainte"], ["Jean-Eudes", "Saint"], ["Bernard", "Saint"], ["Christophe", "Saint"], ["Fabrice", "Saint"], ["Rose de Lima", "Sainte"], ["Barthélémy", "Saint"], ["Louis", "Saint"], ["Natacha", "Sainte"], ["Monique", "Sainte"], ["Augustin", "Saint"], ["Sabine", "Sainte"], ["Fiacre", "Saint"], ["Aristide", "Saint"]],
  [["Gilles", "Saint"], ["Ingrid", "Sainte"], ["Grégoire", "Saint"], ["Rosalie", "Sainte"], ["Raïssa", "Sainte"], ["Bertrand", "Saint"], ["Reine", "Sainte"], ["Nativité de Marie", ""], ["Alain", "Saint"], ["Inès", "Sainte"], ["Adelphe", "Saint"], ["Apollinaire", "Saint"], ["Aimé", "Saint"], ["Croix Glorieuse", ""], ["Roland", "Saint"], ["Edith", "Sainte"], ["Renaud", "Saint"], ["Nadège", "Sainte"], ["Emilie", "Sainte"], ["Davy", "Saint"], ["Matthieu", "Saint"], ["Maurice", "Saint"], ["Automne", ""], ["Thècle", "Sainte"], ["Hermann", "Saint"], ["Côme, Damien", "Saint"], ["Vincent de Paul", "Saint"], ["Venceslas", "Saint"], ["Michel, Gabriel, Raphaël", "Saint"], ["Jérôme", "Saint"]],
  [["Thérèse de l'Enfant-Jésus", "Sainte"], ["Léger", "Saint"], ["Gérard", "Saint"], ["François d'Assise", "Saint"], ["Fleur", "Sainte"], ["Bruno", "Saint"], ["Serge", "Saint"], ["Pélagie", "Sainte"], ["Denis", "Saint"], ["Ghislain", "Saint"], ["Firmin", "Saint"], ["Wilfried", "Saint"], ["Géraud", "Saint"], ["Juste", "Saint"], ["Thérèse d'Avila", "Sainte"], ["Edwige", "Sainte"], ["Baudoin", "Saint"], ["Luc", "Saint"], ["René", "Saint"], ["Adeline", "Sainte"], ["Céline", "Sainte"], ["Elodie", "Sainte"], ["Jean de Capistran", "Saint"], ["Florentin", "Saint"], ["Crépin", "Saint"], ["Dimitri", "Saint"], ["Emeline", "Sainte"], ["Jude", "Saint"], ["Narcisse", "Saint"], ["Bienvenue", "Sainte"], ["Quentin", "Saint"]],
  [["Toussaint", ""], ["Défunts", ""], ["Hubert", "Saint"], ["Charles", "Saint"], ["Sylvie", "Sainte"], ["Bertille", "Sainte"], ["Carine", "Sainte"], ["Geoffroy", "Saint"], ["Théodore", "Saint"], ["Léon", "Saint"], ["Armistice 1918", ""], ["Christian", "Saint"], ["Brice", "Saint"], ["Sidoine", "Saint"], ["Albert", "Saint"], ["Marguerite", "Sainte"], ["Elisabeth", "Sainte"], ["Aude", "Sainte"], ["Tanguy", "Saint"], ["Edmond", "Saint"], ["Présentation de Marie", ""], ["Cécile", "Sainte"], ["Clément", "Saint"], ["Flora", "Sainte"], ["Catherine", "Sainte"], ["Delphine", "Sainte"], ["Séverin", "Saint"], ["Jacques de la Marche", "Saint"], ["Saturnin", "Saint"], ["André", "Saint"]],
  [["Florence", "Sainte"], ["Viviane", "Sainte"], ["François-Xavier", "Saint"], ["Barbara", "Sainte"], ["Gérald", "Saint"], ["Nicolas", "Saint"], ["Ambroise", "Saint"], ["Immaculée Conception", ""], ["Pierre Fourier", "Saint"], ["Romaric", "Saint"], ["Daniel", "Saint"], ["Jeanne-Françoise de Chantal", "Sainte"], ["Lucie", "Sainte"], ["Odile", "Sainte"], ["Ninon", "Sainte"], ["Alice", "Sainte"], ["Gaël", "Saint"], ["Gatien", "Saint"], ["Urbain", "Saint"], ["Théophile", "Saint"], ["Solstice d'Hiver", ""], ["Françoise-Xavière", "Sainte"], ["Armand", "Saint"], ["Adèle", "Sainte"], ["Noël", ""], ["Etienne", "Saint"], ["Jean", "Saint"], ["Innocents", "Saints"], ["David", "Saint"], ["Roger", "Saint"], ["Sylvestre", "Saint"]],
];
function feteDuJour(d) {
  const row = FETE_DATA[d.getMonth()];
  const entry = row[Math.min(d.getDate() - 1, row.length - 1)];
  return entry;
}

const QUOTES = [
  "Chaque petit geste compte.",
  "La régularité bat l'intensité.",
  "Un jour de plus, une racine de plus.",
  "Doucement, mais chaque jour.",
  "Ce que tu répètes, tu deviens.",
  "Petit pas, vraie constance.",
];

// Today's date has to live in state: without it, a session left open overnight
// keeps writing to the previous day. Re-checked at midnight and again whenever
// the app comes back to the foreground, since iOS freezes timers in background.
function useToday() {
  const [today, setToday] = useState(() => toISO(new Date()));

  useEffect(() => {
    let timer;
    const check = () => {
      const current = toISO(new Date());
      setToday((prev) => (prev === current ? prev : current));
      schedule();
    };
    const schedule = () => {
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      clearTimeout(timer);
      timer = setTimeout(check, nextMidnight - Date.now() + 1000);
    };
    const onVisible = () => { if (!document.hidden) check(); };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return today;
}

// Ticks on its own 15s timer so the rest of the tree (habit cards, plants)
// doesn't re-render every tick.
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <p style={{ color: BASE.ink, opacity: 0.65, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs uppercase tracking-widest mb-1 capitalize">
      {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
    </p>
  );
}

// Decorative mountain illustration for the header — layered pastel peaks.
function MountainArt() {
  return (
    <svg viewBox="0 0 400 128" width="100%" height="128" preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCE5EC" />
          <stop offset="100%" stopColor={BASE.paper} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGrad)" />
      <circle cx="322" cy="34" r="16" fill={PALETTE[3].soft} opacity="0.8" />

      {/* back range */}
      <path d="M0,88 L60,40 L110,74 L165,28 L230,80 L290,38 L340,72 L400,44 L400,128 L0,128 Z" fill={PALETTE[4].soft} opacity="0.55" />
      {/* mid range with snow caps */}
      <path d="M0,110 L70,58 L120,92 L190,46 L255,98 L320,54 L400,86 L400,128 L0,128 Z" fill={PALETTE[2].soft} opacity="0.8" />
      <path d="M70,58 L84,71 L56,71 Z" fill="#FFFFFF" opacity="0.85" />
      <path d="M190,46 L204,60 L176,60 Z" fill="#FFFFFF" opacity="0.85" />
      <path d="M320,54 L332,66 L308,66 Z" fill="#FFFFFF" opacity="0.85" />
      {/* front range */}
      <path d="M0,124 L50,92 L100,116 L160,82 L215,120 L280,88 L340,118 L400,100 L400,128 L0,128 Z" fill={PALETTE[2].deep} opacity="0.4" />
    </svg>
  );
}

// Small bouquet illustration shown when every habit is completed for the day.
function BloomBurst() {
  const flowers = [
    { x: 30, y: 42, c: PALETTE[0].deep, s: 8 },
    { x: 60, y: 30, c: PALETTE[3].deep, s: 9 },
    { x: 90, y: 44, c: PALETTE[4].deep, s: 7 },
  ];
  return (
    <svg viewBox="0 0 120 56" width="120" height="56">
      {flowers.map((f, i) => (
        <g key={i}>
          <line x1={f.x} y1={f.y + f.s} x2={f.x} y2="54" stroke={BASE.stem} strokeWidth="1.5" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx={f.x}
              cy={f.y - f.s * 0.55}
              rx={f.s * 0.42}
              ry={f.s * 0.68}
              fill={f.c}
              opacity="0.88"
              transform={`rotate(${a} ${f.x} ${f.y}) `}
            />
          ))}
          <circle cx={f.x} cy={f.y} r={f.s * 0.32} fill={PALETTE[3].soft} />
        </g>
      ))}
    </svg>
  );
}

function Plant({ colors, total, height = 176, width = 140, big = false }) {
  const usable = height - 34;
  const n = colors.length;
  const stemHeight = total === 0 ? 0 : Math.max(6, (n / Math.max(total, 1)) * usable);
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 0.3);
    const y = height - 16 - t * stemHeight;
    const side = i % 2 === 0 ? 1 : -1;
    const cx = width / 2 + side * (big ? 15 : 8);
    leaves.push(
      <ellipse
        key={i}
        cx={cx}
        cy={y}
        rx={big ? 13 : 7}
        ry={big ? 7 : 4}
        transform={`rotate(${side * 40} ${cx} ${y})`}
        fill={colors[i]}
        opacity={0.92}
        style={{ transition: "cy 0.35s ease, opacity 0.35s ease" }}
      />
    );
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <line
        x1={width / 2}
        y1={height - 14}
        x2={width / 2}
        y2={height - 14 - stemHeight}
        stroke={BASE.stem}
        strokeWidth={big ? 4 : 3}
        strokeLinecap="round"
        style={{ transition: "y2 0.35s ease" }}
      />
      {leaves}
      {total > 0 && (
        <circle cx={width / 2} cy={height - 14 - stemHeight} r={big ? 6 : 4} fill={n === total ? PALETTE[3].deep : BASE.stem} style={{ transition: "cy 0.35s ease, fill 0.35s ease" }} />
      )}
    </svg>
  );
}

// Typing a value beats tapping "+" eight times to reach 8000 steps. The tick
// button is not optional: iOS shows a decimal keypad with no return key, so
// without it the only way out would be tapping elsewhere on the page. Blur and
// the button both commit the same draft, so whichever lands first is correct.
function CountEditor({ habit, value, accent, onCommit }) {
  // Seeded with a comma so editing matches what the card shows and what a
  // French keyboard produces. setCount converts it back on the way out.
  const [draft, setDraft] = useState(String(value ?? 0).replace(".", ","));
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => { if (e.key === "Enter") onCommit(draft); }}
        aria-label={`Valeur pour ${habit.name}`}
        className="w-20 rounded-lg px-2 py-1 text-sm outline-none"
        style={{ background: BASE.paper, color: BASE.ink, border: `1px solid ${accent}` }}
      />
      <button
        onClick={() => onCommit(draft)}
        aria-label="Valider la valeur"
        className="w-11 h-11 -my-2 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
        style={{ background: accent, color: BASE.paper }}
      >
        <Check size={16} />
      </button>
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Backup and restore. Restoring replaces everything, so the file is parsed and
// summarised first and only written once the user confirms what's in it.
function DataSheet({ onClose, onRestore }) {
  const [pending, setPending] = useState(null);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState("");
  const [lastBackup, setLastBackup] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { getLastBackup().then(setLastBackup); }, []);

  async function handleExport() {
    setProblem("");
    try {
      const result = await exportBackup();
      if (result === "cancelled") return;
      setStatus(result === "shared" ? "Sauvegarde envoyée." : "Sauvegarde téléchargée.");
      setLastBackup(new Date().toISOString());
    } catch (_) {
      setProblem("L'export a échoué. Réessaie.");
    }
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setProblem("");
    setStatus("");
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      setProblem(err.message);
    }
  }

  async function confirmRestore() {
    try {
      await restoreBackup(pending);
      onRestore(pending);
    } catch (_) {
      setProblem("La restauration a échoué. Tes données actuelles sont intactes.");
      setPending(null);
    }
  }

  const lastLabel = formatDateTime(lastBackup);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(58,52,44,0.35)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[28px] p-5 pb-8"
        style={{ background: BASE.paper, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Mes données</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-2 flex items-center justify-center active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        {!pending ? (
          <>
            <p className="text-sm mb-5" style={{ color: BASE.muted }}>
              Ton historique est enregistré sur cet appareil uniquement. Fais une sauvegarde de temps en temps
              pour pouvoir le retrouver sur un nouveau téléphone.
            </p>

            <div className="rounded-2xl p-4 mb-3 flex items-start gap-3" style={{ background: PALETTE[1].tint, border: `1px solid ${PALETTE[1].soft}` }}>
              <Shield size={18} color={PALETTE[1].deep} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed" style={{ color: BASE.ink }}>
                {lastLabel
                  ? `Dernière sauvegarde le ${lastLabel}.`
                  : "Tu n'as encore jamais sauvegardé tes données."}
              </p>
            </div>

            <button
              onClick={handleExport}
              className="w-full rounded-2xl py-3.5 mb-2 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: PALETTE[1].deep, color: BASE.paper, minHeight: 44 }}
            >
              <Download size={16} /> Sauvegarder mes données
            </button>

            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              className="w-full rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ border: `1.5px solid ${BASE.line}`, color: BASE.ink, minHeight: 44 }}
            >
              <Upload size={16} /> Restaurer une sauvegarde
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />

            {status && <p className="text-sm mt-4 text-center" style={{ color: PALETTE[1].deep }}>{status}</p>}
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: BASE.muted }}>Cette sauvegarde contient :</p>
            <div className="rounded-2xl p-4 mb-4" style={{ background: BASE.paperDeep }}>
              <p className="text-sm mb-1"><strong>{pending.habitCount}</strong> habitude{pending.habitCount > 1 ? "s" : ""}</p>
              <p className="text-sm mb-1"><strong>{pending.dayCount}</strong> jour{pending.dayCount > 1 ? "s" : ""} d'historique</p>
              {formatDateTime(pending.exportedAt) && (
                <p className="text-xs mt-2" style={{ color: BASE.muted }}>Exportée le {formatDateTime(pending.exportedAt)}</p>
              )}
            </div>
            <p className="text-sm mb-4" style={{ color: "#B23A3A" }}>
              Elle remplacera intégralement tes habitudes et ton historique actuels.
            </p>
            <button
              onClick={confirmRestore}
              className="w-full rounded-2xl py-3.5 mb-2 text-sm font-medium active:scale-[0.98] transition-transform"
              style={{ background: "#B23A3A", color: BASE.paper, minHeight: 44 }}
            >
              Remplacer mes données
            </button>
            <button
              onClick={() => setPending(null)}
              className="w-full rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-transform"
              style={{ border: `1.5px solid ${BASE.line}`, color: BASE.ink, minHeight: 44 }}
            >
              Annuler
            </button>
          </>
        )}

        {problem && <p className="text-sm mt-4 text-center" style={{ color: "#B23A3A" }}>{problem}</p>}
      </div>
    </div>
  );
}

export default function HabitTracker() {
  const [habits, setHabits] = useState(null);
  const [entries, setEntries] = useState(null);
  const [ready, setReady] = useState(false);
  // null when closed, otherwise { habit } where a null habit means "create".
  const [formFor, setFormFor] = useState(null);
  const [error, setError] = useState("");
  const [showData, setShowData] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCount, setEditingCount] = useState(null);
  // null means "today", so the view follows the date across midnight on its own.
  const [viewDate, setViewDate] = useState(null);
  const [undo, setUndo] = useState(null);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(id);
  }, [error]);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), 7000);
    return () => clearTimeout(id);
  }, [undo]);

  const today = useToday();
  const weekDates = lastNDates(7);
  const quote = QUOTES[dayOfYear(new Date()) % QUOTES.length];

  useEffect(() => {
    (async () => {
      const stored = await loadHabits();
      const firstRun = stored === null;
      let h = firstRun ? DEFAULT_HABITS : stored;

      // Migration: an earlier version of this app saved "nosnack" as a simple
      // check habit. If that old shape is still in storage, upgrade it to the
      // new 4-period version without touching any other habit the user added.
      const newNosnack = DEFAULT_HABITS.find((d) => d.id === "nosnack");
      let migrated = false;
      h = h.map((hb) => {
        if (hb.id === "nosnack" && hb.type !== "multi") {
          migrated = true;
          return newNosnack;
        }
        return hb;
      });
      // Seeding on first run keeps storage the single source of truth, so a
      // backup taken before any edit still contains the habit list.
      if (firstRun || migrated) {
        try { await persistHabits(h); } catch (_) {}
      }

      setHabits(h);
      setEntries(await loadEntries());
      setReady(true);
    })();
  }, []);

  const saveHabits = useCallback(async (next) => {
    setHabits(next);
    try {
      await persistHabits(next);
      setError("");
    } catch (_) {
      setError("Impossible d'enregistrer. Réessaie.");
    }
  }, []);

  const saveEntries = useCallback(async (next) => {
    setEntries(next);
    try {
      await persistEntries(next);
      setError("");
    } catch (_) {
      setError("Impossible d'enregistrer. Réessaie.");
    }
  }, []);

  if (!ready) {
    return (
      <div style={{ background: BASE.paper, color: BASE.ink, minHeight: "400px" }} className="flex items-center justify-center p-10 font-sans">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm tracking-wide">chargement du jardin…</p>
      </div>
    );
  }

  const activeDate = viewDate || today;
  const isViewingToday = activeDate === today;
  const activeValues = entries[activeDate] || {};
  // Only habits actually asked for on this day count towards the tally: a
  // Mon/Wed/Fri habit must not make Sunday look like a failure, and a weekly
  // one is judged over its whole week instead of any single day.
  const requiredIdx = habits.map((h, i) => (isRequiredOn(h, activeDate) ? i : -1)).filter((i) => i >= 0);
  const completedIdx = requiredIdx.filter((i) => isDone(habits[i], activeValues[habits[i].id]));
  const completedToday = completedIdx.length;
  const requiredCount = requiredIdx.length;
  const allDone = requiredCount > 0 && completedToday === requiredCount;

  function setValue(habitId, value) {
    const next = { ...entries, [activeDate]: { ...(entries[activeDate] || {}), [habitId]: value } };
    saveEntries(next);
  }
  function toggleCheck(h) { setValue(h.id, !isDone(h, activeValues[h.id])); }
  function toggleSub(h, subId) {
    const current = activeValues[h.id] || {};
    setValue(h.id, { ...current, [subId]: !current[subId] });
  }
  function bump(h, delta) {
    const current = Number(activeValues[h.id] || 0);
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setValue(h.id, next);
  }
  // French keyboards produce a comma for the decimal separator.
  function setCount(h, raw) {
    const parsed = parseFloat(String(raw).replace(",", "."));
    setValue(h.id, isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 100) / 100));
    setEditingCount(null);
  }
  // Entries stay keyed by habit id and are never deleted, so putting the habit
  // back at its original index restores its history and streak untouched.
  function removeHabit(id) {
    const index = habits.findIndex((h) => h.id === id);
    if (index < 0) return;
    const next = habits.filter((h) => h.id !== id);
    setUndo({ habit: habits[index], index });
    saveHabits(next);
    // Nothing left to edit, and the toggle that would exit edit mode is hidden
    // once the list is empty.
    if (next.length === 0) setEditMode(false);
  }
  function undoRemove() {
    if (!undo) return;
    const next = [...habits];
    next.splice(Math.min(undo.index, next.length), 0, undo.habit);
    saveHabits(next);
    setUndo(null);
  }
  // Editing keeps the habit id, and so keeps every entry already recorded
  // against it — the whole point of editing rather than delete-and-recreate.
  function saveHabit(habit) {
    const known = habits.some((h) => h.id === habit.id);
    saveHabits(known ? habits.map((h) => (h.id === habit.id ? habit : h)) : [...habits, habit]);
    setFormFor(null);
    setError("");
  }

  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const [feteName, feteTitle] = feteDuJour(new Date());
  const feteLabel = feteTitle ? `Fête : ${feteTitle} ${feteName}` : feteName;
  const activeDayLabel = new Date(activeDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ background: BASE.paper, color: BASE.ink, fontFamily: "'Inter', sans-serif" }} className="min-h-full w-full">
      <div className="max-w-md mx-auto pb-16">
        <div className="relative overflow-hidden rounded-b-[28px] mb-6">
          <MountainArt />
          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-4">
            <Clock />
            <h1 style={{ fontFamily: "'Fraunces', serif" }} className="text-3xl font-semibold capitalize">{dateLabel}</h1>
            <p style={{ color: BASE.ink, opacity: 0.7 }} className="text-xs mt-1">{feteLabel}</p>
          </div>
        </div>

        <div className="px-5">
          {!isViewingToday && (
            <div className="flex items-center gap-3 rounded-2xl p-3 mb-3" style={{ background: PALETTE[2].tint, border: `1px solid ${PALETTE[2].soft}` }}>
              <CalendarClock size={18} color={PALETTE[2].deep} className="shrink-0" />
              <p className="text-xs flex-1 leading-snug">
                Tu complètes <span className="font-semibold capitalize">{activeDayLabel}</span>
              </p>
              <button
                onClick={() => setViewDate(null)}
                className="shrink-0 rounded-xl px-3 text-xs font-medium active:scale-95 transition-transform"
                style={{ background: PALETTE[2].deep, color: BASE.paper, minHeight: 44 }}
              >
                Aujourd'hui
              </button>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl p-4 mb-3" style={{ background: BASE.paperDeep }}>
            <div>
              <p className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{completedToday}/{requiredCount}</p>
              <p className="text-sm" style={{ color: BASE.muted }}>
                {isViewingToday ? "habitudes tenues aujourd'hui" : "habitudes tenues ce jour-là"}
              </p>
            </div>
            <Plant colors={completedIdx.map((i) => colorFor(i).deep)} total={requiredCount} big />
          </div>

          {allDone && (
            <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: PALETTE[3].tint, border: `1px solid ${PALETTE[3].soft}` }}>
              <BloomBurst />
              <p className="text-sm italic" style={{ fontFamily: "'Fraunces', serif", color: PALETTE[5].deep }}>{quote}</p>
            </div>
          )}
          {!allDone && <div className="mb-4" />}

          {habits.length > 0 && (
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-widest" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
                Habitudes
              </p>
              <button
                onClick={() => { setEditMode((v) => !v); setEditingCount(null); }}
                className="text-xs font-medium px-2 -mr-2 active:opacity-60 transition-opacity"
                style={{ color: editMode ? PALETTE[1].deep : BASE.muted, minHeight: 44 }}
              >
                {editMode ? "Terminé" : "Modifier"}
              </button>
            </div>
          )}

          <div className="space-y-3 mb-7">
            {habits.map((h, i) => {
              const Icon = iconFor(h.icon);
              const done = isDone(h, activeValues[h.id]);
              const nDone = countDone(h, activeValues[h.id]);
              const streak = streakFor(h, entries, today);
              const c = colorFor(i);
              const isMulti = h.type === "multi";
              const isWeekly = freqKind(h) === FREQ_PER_WEEK;
              // A day the habit isn't asked for: still loggable as a bonus, but
              // shown as a rest day so an empty card doesn't read as a failure.
              const resting = !isScheduled(h, activeDate);
              const badge = freqLabel(h);
              // For multi-period habits, the card tints gradually as periods get checked off.
              const bg = done ? c.deep : isMulti && nDone > 0 ? c.tint : BASE.paperDeep;
              const fg = done ? BASE.paper : BASE.ink;
              const subtle = done ? "rgba(251,247,241,0.8)" : BASE.muted;
              return (
                <div
                  key={h.id}
                  className="rounded-2xl p-4"
                  style={{ background: bg, color: fg, opacity: resting && !done ? 0.62 : 1, transition: "background 0.25s ease, opacity 0.25s ease" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-full p-2" style={{ background: done ? "rgba(255,255,255,0.2)" : c.tint }}>
                      <Icon size={18} color={done ? BASE.paper : c.deep} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{h.name}</p>
                      {h.type === "count" && (
                        editingCount === h.id ? (
                          <CountEditor
                            habit={h}
                            value={activeValues[h.id] || 0}
                            accent={c.deep}
                            onCommit={(raw) => setCount(h, raw)}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCount(h.id)}
                            disabled={editMode}
                            // Padding pulled back by an equal negative margin: a 44px
                            // tap target that takes no extra room in the card.
                            className="text-xs mt-0.5 block py-3.5 -my-3.5 active:opacity-60 transition-opacity"
                            style={{ color: subtle, textDecoration: "underline dotted", textUnderlineOffset: 3 }}
                          >
                            {fmtNum(activeValues[h.id])} / {fmtNum(h.target)} {h.unit}
                          </button>
                        )
                      )}
                      {isMulti && (
                        <p className="text-xs mt-0.5" style={{ color: subtle }}>
                          {nDone} / {h.subitems.length} périodes tenues
                        </p>
                      )}
                      {isWeekly && (
                        <p className="text-xs mt-0.5" style={{ color: subtle }}>
                          {weekDoneCount(h, entries, activeDate)} / {weekTarget(h)} jours cette semaine
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {streak > 0 && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: done ? PALETTE[3].soft : PALETTE[3].deep }}>
                            <Flame size={12} /> {streak} {isWeekly ? (streak > 1 ? "sem. de suite" : "sem.") : "j de suite"}
                          </p>
                        )}
                        {/* A weekly habit already states its target on the line above. */}
                        {badge && !isWeekly && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: subtle }}>
                            {resting && <Moon size={11} />} {badge}
                          </p>
                        )}
                      </div>
                    </div>

                    {editMode ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setFormFor({ habit: h })}
                          aria-label={`Modifier ${h.name}`}
                          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: BASE.paper, color: BASE.ink, border: `1px solid ${BASE.line}` }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => removeHabit(h.id)}
                          aria-label={`Supprimer ${h.name}`}
                          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: BASE.danger, color: "#FFFFFF" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {h.type === "check" && (
                          <button
                            onClick={() => toggleCheck(h)}
                            aria-label={done ? "Marquer comme non fait" : "Marquer comme fait"}
                            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                            style={{ background: done ? "rgba(255,255,255,0.9)" : "transparent", border: `2px solid ${done ? "rgba(255,255,255,0.9)" : BASE.stem}` }}
                          >
                            {done && <Check size={20} color={c.deep} className="pop-in" />}
                          </button>
                        )}
                        {h.type === "count" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => bump(h, -h.step)} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ border: `1px solid ${done ? "rgba(255,255,255,0.5)" : BASE.stem}` }} aria-label="Retirer">
                              <Minus size={16} />
                            </button>
                            <button onClick={() => bump(h, h.step)} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ border: `1px solid ${done ? "rgba(255,255,255,0.5)" : BASE.stem}`, background: done ? "rgba(255,255,255,0.2)" : "transparent" }} aria-label="Ajouter">
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isMulti && !editMode && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {h.subitems.map((s) => {
                        const subDone = !!(activeValues[h.id] || {})[s.id];
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleSub(h, s.id)}
                            className="flex-1 min-w-[70px] rounded-xl py-2 text-xs font-medium flex flex-col items-center gap-1 active:scale-95 transition-transform"
                            style={{
                              background: subDone ? (done ? "rgba(255,255,255,0.22)" : c.deep) : "rgba(255,255,255,0.5)",
                              color: subDone ? (done ? BASE.paper : BASE.paper) : BASE.ink,
                              border: `1px solid ${subDone ? "transparent" : BASE.line}`,
                            }}
                          >
                            <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: subDone ? "rgba(255,255,255,0.3)" : "transparent", border: subDone ? "none" : `1.5px solid ${BASE.stem}` }}>
                              {subDone && <Check size={10} className="pop-in" />}
                            </span>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-2 gap-2">
              <p className="text-xs uppercase tracking-widest shrink-0" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Cette semaine</p>
              <p className="text-xs text-right" style={{ color: BASE.muted }}>touche un jour pour le compléter</p>
            </div>
            <div className="flex justify-between items-end rounded-2xl p-3" style={{ background: BASE.paperDeep }}>
              {weekDates.map((d) => {
                const vals = entries[d] || {};
                const idxRequired = habits.map((h, i) => (isRequiredOn(h, d) ? i : -1)).filter((i) => i >= 0);
                const idxDone = idxRequired.filter((i) => isDone(habits[i], vals[habits[i].id]));
                const dayDate = fromISO(d);
                const dayIdx = dayDate.getDay();
                const isThisToday = d === today;
                const isSelected = d === activeDate;
                return (
                  <button
                    key={d}
                    onClick={() => setViewDate(isThisToday ? null : d)}
                    aria-label={`Compléter ${dayDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
                    aria-pressed={isSelected}
                    className="flex-1 flex flex-col items-center gap-1 rounded-xl py-1 active:scale-95 transition-transform"
                    style={{ background: isSelected ? BASE.paper : "transparent" }}
                  >
                    <Plant colors={idxDone.map((i) => colorFor(i).deep)} total={idxRequired.length} height={72} width={30} />
                    <span className="text-xs" style={{ color: isThisToday ? PALETTE[1].deep : BASE.muted, fontWeight: isSelected ? 600 : 400 }}>{DOW[dayIdx]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm mb-4" style={{ color: "#B23A3A" }}>{error}</p>}

          <button
            onClick={() => setFormFor({ habit: null })}
            className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform"
            style={{ border: `1.5px dashed ${BASE.stem}`, color: PALETTE[1].deep, minHeight: 44 }}
          >
            <Plus size={16} /> Ajouter une habitude
          </button>

          <button
            onClick={() => setShowData(true)}
            className="w-full mt-8 py-3 text-xs flex items-center justify-center gap-1.5 active:opacity-60 transition-opacity"
            style={{ color: BASE.muted, minHeight: 44 }}
          >
            <Shield size={13} /> Mes données &amp; sauvegarde
          </button>
        </div>
      </div>

      {undo && (
        <div className="fixed left-0 right-0 z-40 flex justify-center px-5" style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <div className="w-full max-w-md rounded-2xl px-4 py-2 flex items-center gap-3" style={{ background: BASE.ink, color: BASE.paper, boxShadow: "0 6px 24px rgba(58,52,44,0.28)" }}>
            <p className="text-sm flex-1 truncate">« {undo.habit.name} » supprimée</p>
            <button
              onClick={undoRemove}
              className="shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 rounded-xl active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.16)", minHeight: 44 }}
            >
              <RotateCcw size={14} /> Annuler
            </button>
          </div>
        </div>
      )}

      {formFor && (
        <HabitForm
          habit={formFor.habit}
          onSave={saveHabit}
          onClose={() => setFormFor(null)}
        />
      )}

      {showData && (
        <DataSheet
          onClose={() => setShowData(false)}
          onRestore={(restored) => {
            setHabits(restored.habits);
            setEntries(restored.entries);
            setShowData(false);
          }}
        />
      )}
    </div>
  );
}
