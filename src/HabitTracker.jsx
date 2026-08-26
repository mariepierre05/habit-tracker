import React, { useState, useEffect, useCallback } from "react";
import { Droplet, BookOpen, Dumbbell, Footprints, UtensilsCrossed, Check, Plus, Trash2, Flame, X, Minus, Sparkles } from "lucide-react";

// Local storage shim mirroring the previous artifact storage API (get returns
// {value} or null, set persists synchronously) so the rest of the component
// logic below didn't need to change shape.
const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v === null ? null : { value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

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

const ICONS = {
  droplet: Droplet,
  book: BookOpen,
  dumbbell: Dumbbell,
  footprints: Footprints,
  meal: UtensilsCrossed,
};
const ICON_KEYS = Object.keys(ICONS);

const DEFAULT_HABITS = [
  { id: "water", name: "Boire 1,5 L d'eau", type: "count", target: 1.5, unit: "L", step: 0.25, icon: "droplet" },
  { id: "duolingo", name: "Séance Duolingo", type: "check", icon: "book" },
  { id: "muscu", name: "Renforcement musculaire", type: "check", icon: "dumbbell" },
  { id: "steps", name: "Marcher", type: "count", target: 8000, unit: "pas", step: 1000, icon: "footprints" },
  {
    id: "nosnack",
    name: "Sans grignotage",
    type: "multi",
    icon: "meal",
    subitems: [
      { id: "matin", label: "Matin" },
      { id: "debut_am", label: "Début d'aprèm" },
      { id: "fin_am", label: "Fin d'aprèm" },
      { id: "soir", label: "Soirée" },
    ],
  },
];

const BASE = {
  ink: "#3A342C",
  paper: "#FBF7F1",
  paperDeep: "#F2EADB",
  line: "#E4DBC7",
  muted: "#9C917E",
  stem: "#9BA98D",
};

// Soft pastel palette — each habit is assigned one, in order.
const PALETTE = [
  { soft: "#F3D9D6", deep: "#C4767A", tint: "#FBEEEC" },
  { soft: "#DCE7D2", deep: "#6E9463", tint: "#EFF4EA" },
  { soft: "#D7E4EC", deep: "#5C87A3", tint: "#EBF2F6" },
  { soft: "#F4E3BC", deep: "#C6963C", tint: "#FAF2DE" },
  { soft: "#E4DAF0", deep: "#8B72B0", tint: "#F2EDF8" },
  { soft: "#F1DCC6", deep: "#C88A50", tint: "#FAF0E6" },
];
function colorFor(i) { return PALETTE[i % PALETTE.length]; }

const QUOTES = [
  "Chaque petit geste compte.",
  "La régularité bat l'intensité.",
  "Un jour de plus, une racine de plus.",
  "Doucement, mais chaque jour.",
  "Ce que tu répètes, tu deviens.",
  "Petit pas, vraie constance.",
];

function pad(n) { return String(n).padStart(2, "0"); }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function lastNDates(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(toISO(d));
  }
  return out;
}
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
const DOW = ["D", "L", "M", "M", "J", "V", "S"];

function isDone(habit, value) {
  if (habit.type === "multi") {
    if (!value) return false;
    return habit.subitems.every((s) => value[s.id] === true);
  }
  if (value === undefined || value === null) return false;
  if (habit.type === "check") return value === true;
  return Number(value) >= habit.target;
}
function countDone(habit, value) {
  if (habit.type !== "multi") return isDone(habit, value) ? 1 : 0;
  if (!value) return 0;
  return habit.subitems.filter((s) => value[s.id] === true).length;
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

export default function HabitTracker() {
  const [habits, setHabits] = useState(null);
  const [entries, setEntries] = useState(null);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", type: "check", target: 1, unit: "", icon: "book" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(id);
  }, [error]);

  const today = toISO(new Date());
  const weekDates = lastNDates(7);
  const quote = QUOTES[dayOfYear(new Date()) % QUOTES.length];

  useEffect(() => {
    (async () => {
      let h = DEFAULT_HABITS;
      let e = {};
      try {
        const r = await storage.get("habits");
        if (r && r.value) h = JSON.parse(r.value);
      } catch (_) {
        try { await storage.set("habits", JSON.stringify(DEFAULT_HABITS)); } catch (_) {}
      }

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
      if (migrated) {
        try { await storage.set("habits", JSON.stringify(h)); } catch (_) {}
      }

      try {
        const r = await storage.get("entries");
        if (r && r.value) e = JSON.parse(r.value);
      } catch (_) {}
      setHabits(h);
      setEntries(e);
      setReady(true);
    })();
  }, []);

  const saveHabits = useCallback(async (next) => {
    setHabits(next);
    try {
      await storage.set("habits", JSON.stringify(next));
      setError("");
    } catch (_) {
      try {
        await storage.set("habits", JSON.stringify(next));
        setError("");
      } catch (_) {
        setError("Impossible d'enregistrer. Réessaie.");
      }
    }
  }, []);

  const saveEntries = useCallback(async (next) => {
    setEntries(next);
    try {
      await storage.set("entries", JSON.stringify(next));
      setError("");
    } catch (_) {
      try {
        await storage.set("entries", JSON.stringify(next));
        setError("");
      } catch (_) {
        setError("Impossible d'enregistrer. Réessaie.");
      }
    }
  }, []);

  if (!ready) {
    return (
      <div style={{ background: BASE.paper, color: BASE.ink, minHeight: "400px" }} className="flex items-center justify-center p-10 font-sans">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm tracking-wide">chargement du jardin…</p>
      </div>
    );
  }

  const todayValues = entries[today] || {};
  const completedIdx = habits.map((h, i) => (isDone(h, todayValues[h.id]) ? i : -1)).filter((i) => i >= 0);
  const completedToday = completedIdx.length;
  const allDone = habits.length > 0 && completedToday === habits.length;

  function setValue(habitId, value) {
    const next = { ...entries, [today]: { ...(entries[today] || {}), [habitId]: value } };
    saveEntries(next);
  }
  function toggleCheck(h) { setValue(h.id, !isDone(h, todayValues[h.id])); }
  function toggleSub(h, subId) {
    const current = todayValues[h.id] || {};
    setValue(h.id, { ...current, [subId]: !current[subId] });
  }
  function bump(h, delta) {
    const current = Number(todayValues[h.id] || 0);
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setValue(h.id, next);
  }
  function streakFor(h) {
    let count = 0;
    const dates = lastNDates(60).reverse();
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      const val = (entries[d] || {})[h.id];
      const done = isDone(h, val);
      if (d === today && !done) continue;
      if (done) count++; else break;
    }
    return count;
  }
  function removeHabit(id, name) {
    if (typeof window !== "undefined" && window.confirm && !window.confirm(`Supprimer « ${name} » ? L'historique de cette habitude sera perdu.`)) return;
    saveHabits(habits.filter((h) => h.id !== id));
  }
  function addHabit() {
    if (!newHabit.name.trim()) { setError("Donne un nom à cette habitude."); return; }
    const id = `h_${Date.now()}`;
    const habit = newHabit.type === "check"
      ? { id, name: newHabit.name.trim(), type: "check", icon: newHabit.icon }
      : { id, name: newHabit.name.trim(), type: "count", target: Number(newHabit.target) || 1, unit: newHabit.unit || "", step: Math.max(1, Math.round((Number(newHabit.target) || 1) / 8)), icon: newHabit.icon };
    saveHabits([...habits, habit]);
    setNewHabit({ name: "", type: "check", target: 1, unit: "", icon: "book" });
    setShowAdd(false);
    setError("");
  }

  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const [feteName, feteTitle] = feteDuJour(new Date());
  const feteLabel = feteTitle ? `Fête : ${feteTitle} ${feteName}` : feteName;

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
          <div className="flex items-center justify-between rounded-2xl p-4 mb-3" style={{ background: BASE.paperDeep }}>
            <div>
              <p className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{completedToday}/{habits.length}</p>
              <p className="text-sm" style={{ color: BASE.muted }}>habitudes tenues aujourd'hui</p>
            </div>
            <Plant colors={completedIdx.map((i) => colorFor(i).deep)} total={habits.length} big />
          </div>

          {allDone && (
            <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: PALETTE[3].tint, border: `1px solid ${PALETTE[3].soft}` }}>
              <BloomBurst />
              <p className="text-sm italic" style={{ fontFamily: "'Fraunces', serif", color: PALETTE[5].deep }}>{quote}</p>
            </div>
          )}
          {!allDone && <div className="mb-4" />}

          <div className="space-y-3 mb-7">
            {habits.map((h, i) => {
              const Icon = ICONS[h.icon] || Check;
              const done = isDone(h, todayValues[h.id]);
              const nDone = countDone(h, todayValues[h.id]);
              const streak = streakFor(h);
              const c = colorFor(i);
              const isMulti = h.type === "multi";
              // For multi-period habits, the card tints gradually as periods get checked off.
              const bg = done ? c.deep : isMulti && nDone > 0 ? c.tint : BASE.paperDeep;
              const fg = done ? BASE.paper : BASE.ink;
              return (
                <div
                  key={h.id}
                  className="rounded-2xl p-4 group"
                  style={{ background: bg, color: fg, transition: "background 0.25s ease" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-full p-2" style={{ background: done ? "rgba(255,255,255,0.2)" : c.tint }}>
                      <Icon size={18} color={done ? BASE.paper : c.deep} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{h.name}</p>
                      {h.type === "count" && (
                        <p className="text-xs mt-0.5" style={{ color: done ? "rgba(251,247,241,0.8)" : BASE.muted }}>
                          {todayValues[h.id] || 0} / {h.target} {h.unit}
                        </p>
                      )}
                      {isMulti && (
                        <p className="text-xs mt-0.5" style={{ color: done ? "rgba(251,247,241,0.8)" : BASE.muted }}>
                          {nDone} / {h.subitems.length} périodes tenues
                        </p>
                      )}
                      {streak > 0 && (
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: done ? PALETTE[3].soft : PALETTE[3].deep }}>
                          <Flame size={12} /> {streak} j de suite
                        </p>
                      )}
                    </div>

                    {h.type === "check" && (
                      <button
                        onClick={() => toggleCheck(h)}
                        aria-label={done ? "Marquer comme non fait" : "Marquer comme fait"}
                        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        style={{ background: done ? "rgba(255,255,255,0.9)" : "transparent", border: `2px solid ${done ? "rgba(255,255,255,0.9)" : BASE.stem}` }}
                      >
                        {done && <Check size={16} color={c.deep} className="pop-in" />}
                      </button>
                    )}
                    {h.type === "count" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => bump(h, -h.step)} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ border: `1px solid ${done ? "rgba(255,255,255,0.5)" : BASE.stem}` }} aria-label="Retirer">
                          <Minus size={13} />
                        </button>
                        <button onClick={() => bump(h, h.step)} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ border: `1px solid ${done ? "rgba(255,255,255,0.5)" : BASE.stem}`, background: done ? "rgba(255,255,255,0.2)" : "transparent" }} aria-label="Ajouter">
                          <Plus size={13} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => removeHabit(h.id, h.name)}
                      className="shrink-0 opacity-45 active:opacity-100 active:scale-90 transition-all p-1"
                      aria-label="Supprimer cette habitude"
                      style={{ color: fg }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isMulti && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {h.subitems.map((s) => {
                        const subDone = !!(todayValues[h.id] || {})[s.id];
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
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Cette semaine</p>
            <div className="flex justify-between items-end rounded-2xl p-4" style={{ background: BASE.paperDeep }}>
              {weekDates.map((d) => {
                const vals = entries[d] || {};
                const idxDone = habits.map((h, i) => (isDone(h, vals[h.id]) ? i : -1)).filter((i) => i >= 0);
                const dayIdx = new Date(d + "T00:00:00").getDay();
                const isToday = d === today;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <Plant colors={idxDone.map((i) => colorFor(i).deep)} total={habits.length} height={72} width={30} />
                    <span className="text-xs" style={{ color: isToday ? PALETTE[1].deep : BASE.muted, fontWeight: isToday ? 600 : 400 }}>{DOW[dayIdx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm mb-4" style={{ color: "#B23A3A" }}>{error}</p>}

          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform"
              style={{ border: `1.5px dashed ${BASE.stem}`, color: PALETTE[1].deep }}
            >
              <Plus size={16} /> Ajouter une habitude
            </button>
          ) : (
            <div className="rounded-2xl p-4" style={{ background: BASE.paperDeep }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Nouvelle habitude</p>
                <button onClick={() => setShowAdd(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <input
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="Ex : Lire 10 pages"
                className="w-full rounded-xl px-3 py-2 mb-3 text-sm outline-none"
                style={{ background: BASE.paper, border: `1px solid ${BASE.line}` }}
              />
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setNewHabit({ ...newHabit, type: "check" })}
                  className="flex-1 rounded-xl py-2 text-sm"
                  style={{ background: newHabit.type === "check" ? PALETTE[1].deep : BASE.paper, color: newHabit.type === "check" ? BASE.paper : BASE.ink, border: `1px solid ${BASE.line}` }}
                >
                  Fait / pas fait
                </button>
                <button
                  onClick={() => setNewHabit({ ...newHabit, type: "count" })}
                  className="flex-1 rounded-xl py-2 text-sm"
                  style={{ background: newHabit.type === "count" ? PALETTE[1].deep : BASE.paper, color: newHabit.type === "count" ? BASE.paper : BASE.ink, border: `1px solid ${BASE.line}` }}
                >
                  Objectif chiffré
                </button>
              </div>
              {newHabit.type === "count" && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={newHabit.target}
                    onChange={(e) => setNewHabit({ ...newHabit, target: e.target.value })}
                    placeholder="Objectif"
                    className="w-1/2 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: BASE.paper, border: `1px solid ${BASE.line}` }}
                  />
                  <input
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                    placeholder="Unité (pas, L, min…)"
                    className="w-1/2 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: BASE.paper, border: `1px solid ${BASE.line}` }}
                  />
                </div>
              )}
              <div className="flex gap-2 mb-4">
                {ICON_KEYS.map((k) => {
                  const Icon = ICONS[k];
                  const sel = newHabit.icon === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setNewHabit({ ...newHabit, icon: k })}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: sel ? PALETTE[1].deep : BASE.paper, color: sel ? BASE.paper : BASE.ink, border: `1px solid ${BASE.line}` }}
                      aria-label={k}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>
              <button onClick={addHabit} className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform" style={{ background: PALETTE[3].deep, color: BASE.paper }}>
                <Sparkles size={14} /> Ajouter
              </button>
            </div>
          )}

          <p className="text-xs text-center mt-8" style={{ color: BASE.muted }}>
            Tes données restent enregistrées sur cet appareil, même si tu fermes l'app.
          </p>
        </div>
      </div>
    </div>
  );
}
