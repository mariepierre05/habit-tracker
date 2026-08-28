import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Check, Sparkles, Minus, Trash2 } from "lucide-react";
import { BASE, PALETTE, ICONS, ICON_KEYS } from "./theme";
import { DOW } from "./dates";
import { FREQ_DAILY, FREQ_WEEKDAYS, FREQ_PER_WEEK, DEFAULT_PERIODS, freqKind, weekTarget, stepFor } from "./habits";

const TYPES = [
  { key: "check", label: "Fait / pas fait" },
  { key: "count", label: "Objectif chiffré" },
  { key: "multi", label: "Plusieurs moments" },
];

const FREQS = [
  { key: FREQ_DAILY, label: "Tous les jours" },
  { key: FREQ_WEEKDAYS, label: "Certains jours" },
  { key: FREQ_PER_WEEK, label: "X fois par semaine" },
];

// getDay() is Sunday-based; France reads a week Monday-first.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function blankForm() {
  return {
    name: "",
    type: "check",
    target: 1,
    unit: "",
    icon: "book",
    periods: DEFAULT_PERIODS.map((p) => ({ ...p })),
    freqKind: FREQ_DAILY,
    freqDays: [1, 3, 5],
    freqTimes: 3,
  };
}

function habitToForm(habit) {
  if (!habit) return blankForm();
  const kind = freqKind(habit);
  return {
    ...blankForm(),
    name: habit.name,
    type: habit.type,
    target: habit.target ?? 1,
    unit: habit.unit || "",
    icon: habit.icon,
    periods: habit.subitems ? habit.subitems.map((p) => ({ ...p })) : DEFAULT_PERIODS.map((p) => ({ ...p })),
    freqKind: kind,
    freqDays: kind === FREQ_WEEKDAYS ? [...(habit.freq.days || [])] : [1, 3, 5],
    freqTimes: kind === FREQ_PER_WEEK ? weekTarget(habit) : 3,
  };
}

// Existing subitem ids are carried through untouched, so renaming a period
// keeps the history already recorded against it.
function formToHabit(form, existing) {
  const habit = {
    id: existing ? existing.id : `h_${Date.now()}`,
    name: form.name.trim(),
    type: form.type,
    icon: form.icon,
  };
  if (form.type === "count") {
    habit.target = Number(String(form.target).replace(",", ".")) || 1;
    habit.unit = form.unit.trim();
    habit.step = stepFor(habit.target);
  }
  if (form.type === "multi") {
    habit.subitems = form.periods.map((p) => ({ id: p.id, label: p.label.trim() }));
  }
  if (form.freqKind === FREQ_WEEKDAYS) habit.freq = { kind: FREQ_WEEKDAYS, days: [...form.freqDays].sort() };
  else if (form.freqKind === FREQ_PER_WEEK) habit.freq = { kind: FREQ_PER_WEEK, times: form.freqTimes };
  // Daily habits carry no `freq` at all, which is also what older saves look like.
  return habit;
}

const inputStyle = { background: BASE.paper, border: `1px solid ${BASE.line}`, color: BASE.ink };

function Segmented({ options, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            disabled={disabled}
            className="w-full rounded-xl px-3 text-sm text-left active:scale-[0.99] transition-transform disabled:opacity-50"
            style={{
              background: on ? PALETTE[1].deep : BASE.paper,
              color: on ? BASE.paper : BASE.ink,
              border: `1px solid ${on ? PALETTE[1].deep : BASE.line}`,
              minHeight: 44,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Label({ children }) {
  return (
    <p className="text-xs uppercase tracking-widest mb-2 mt-4" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </p>
  );
}

export default function HabitForm({ habit, onSave, onClose }) {
  const [form, setForm] = useState(() => habitToForm(habit));
  const [problem, setProblem] = useState("");
  const editing = !!habit;
  const panelRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // The form is its own screen now, so there is nothing above it to scroll past.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // TEMPORARY, and deliberately passive. The previous version listened for
  // every touch and re-rendered to log it; on the device the tap sequence then
  // died between pointerdown and click, which is what a re-render mid-gesture
  // does. Measuring on demand only, so the instrument stops disturbing what it
  // measures. Remove once the tap problem is settled.
  const [log, setLog] = useState([]);
  const [probeText, setProbeText] = useState("");

  function probe() {
    const input = panelRef.current?.querySelector('input[aria-label="Nom de l\'habitude"]');
    if (!input) return;
    const r = input.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    const under = document.elementFromPoint(cx, cy);
    const cs = getComputedStyle(input);
    input.focus();
    const se = document.scrollingElement || document.documentElement;
    const vv = window.visualViewport;
    const lines = [
      `champ: ${Math.round(r.width)}×${Math.round(r.height)} à (${Math.round(r.left)},${Math.round(r.top)})`,
      `au centre du champ: ${under && under.tagName ? under.tagName.toLowerCase() + (under.getAttribute("aria-label") ? "[" + under.getAttribute("aria-label") + "]" : "") : String(under)}`,
      `focus programmé → ${document.activeElement === input ? "OK" : "REFUSÉ"}`,
      `scrollY=${Math.round(window.scrollY)} scrollTop=${Math.round(se.scrollTop)} ecart=${Math.round(window.scrollY - se.scrollTop)}`,
      `visual offsetTop=${vv ? Math.round(vv.offsetTop) : "n/a"} pageTop=${vv ? Math.round(vv.pageTop) : "n/a"}`,
      `viewport ${window.innerWidth}×${window.innerHeight}, visual ${vv ? Math.round(vv.height) : "n/a"}`,
      `page: ${Math.round(se.scrollHeight)} px`,
    ];
    setLog(lines);
  }

  // The field works in Safari and fails in the installed app, while a text
  // field in the reminder overlay works in both. What separates them is the
  // page itself: these are the global rules applied to the document — and only
  // to the document — plus viewport-fit, which is what makes the safe-area
  // insets non-zero in standalone and zero in Safari. Each button lifts one of
  // them at runtime so all four can be tested in a single deploy.
  function lift(which) {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const done = [];
    if (which === "overscroll" || which === "all") {
      html.style.overscrollBehaviorY = "auto";
      done.push("overscroll-behavior levé");
    }
    if (which === "safearea" || which === "all") {
      body.style.paddingTop = "0px";
      body.style.paddingBottom = "0px";
      done.push("marges safe-area retirées");
    }
    if (which === "height" || which === "all") {
      html.style.height = "auto";
      body.style.height = "auto";
      if (root) root.style.height = "auto";
      done.push("height:100% retiré");
    }
    if (which === "viewport" || which === "all") {
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) meta.setAttribute("content", "width=device-width, initial-scale=1.0");
      done.push("viewport-fit=cover retiré");
    }
    setLog([`✓ ${done.join(" · ")}`, "→ essaie maintenant de taper dans le Témoin B ci-dessus"]);
  }

  function toggleDay(d) {
    set({ freqDays: form.freqDays.includes(d) ? form.freqDays.filter((x) => x !== d) : [...form.freqDays, d] });
  }
  function setPeriod(i, label) {
    set({ periods: form.periods.map((p, idx) => (idx === i ? { ...p, label } : p)) });
  }
  function addPeriod() {
    set({ periods: [...form.periods, { id: `p_${Date.now()}`, label: "" }] });
  }
  function removePeriod(i) {
    set({ periods: form.periods.filter((_, idx) => idx !== i) });
  }

  function submit() {
    if (!form.name.trim()) return setProblem("Donne un nom à cette habitude.");
    if (form.freqKind === FREQ_WEEKDAYS && form.freqDays.length === 0) return setProblem("Choisis au moins un jour.");
    if (form.type === "multi") {
      const filled = form.periods.filter((p) => p.label.trim());
      if (filled.length < 2) return setProblem("Il faut au moins deux moments.");
      onSave(formToHabit({ ...form, periods: filled }, habit));
      return;
    }
    onSave(formToHabit(form, habit));
  }

  // Deliberately laid out in the page rather than in a fixed overlay. A text
  // field inside a `position: fixed` layer is a long-standing iOS trap — the
  // tap can fail to focus it and the keyboard never opens — and this form was
  // reported broken on iPhone only after it was turned into a floating sheet.
  return (
    <div ref={panelRef} className="rounded-2xl p-4" style={{ background: BASE.paperDeep }}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            {editing ? "Modifier l'habitude" : "Nouvelle habitude"}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-2 flex items-center justify-center active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        {/* Wrapped in a label on purpose. The reminder sheet's time field is the
            only input in the app known to work on the reporter's iPhone, and it
            is also the only one inside a <label> — which forwards activation to
            the control even when a direct tap on it does not take. */}
        <label className="block mt-4">
          <span className="block text-xs uppercase tracking-widest mb-2" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
            Nom
          </span>
          <input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Ex : Lire 10 pages"
            aria-label="Nom de l'habitude"
            className="w-full rounded-xl px-3 outline-none"
            style={{ ...inputStyle, minHeight: 44 }}
          />
        </label>

        {/* TEMPORARY. Three probes that differ one variable at a time.
            A sits where the real field sits, with the minimal markup that is
            known to work; B is the same markup lower down; C carries the real
            field's exact classes and styles. Whichever of position or markup
            predicts failure is the cause. */}
        <input
          aria-label="Témoin A"
          placeholder="Témoin A — juste sous le vrai champ"
          style={{ border: "1px solid #999", padding: 6, width: "100%", marginTop: 8 }}
        />

        <div className="mt-4 rounded-xl p-3" style={{ background: "#FFF9E6", border: "1px solid #E0C97A" }}>
          <p className="text-xs font-semibold mb-2">Diagnostic (temporaire)</p>

          <input aria-label="Témoin B" placeholder="Témoin B — markup minimal" style={{ border: "1px solid #999", padding: 6, width: "100%" }} />

          {/* The decisive one: same minimal markup as B, but inside a <label>,
              exactly like the reminder field that works. */}
          <label style={{ display: "block", marginTop: 8, border: "2px solid #6E9463", padding: 6, borderRadius: 8 }}>
            <span style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Témoin D — dans un label (touche ce texte aussi)</span>
            <input aria-label="Témoin D" placeholder="Témoin D" style={{ border: "1px solid #999", padding: 6, width: "100%" }} />
          </label>

          <input
            aria-label="Témoin C"
            value={probeText}
            onChange={(e) => setProbeText(e.target.value)}
            placeholder="Témoin C — style du vrai champ"
            className="w-full rounded-xl px-3 outline-none"
            style={{ ...inputStyle, minHeight: 44, marginTop: 8 }}
          />

          <p className="text-xs mt-3 mb-2">
            Appuie sur un bouton, puis réessaie de taper dans le Témoin B. Celui qui
            débloque la saisie désigne le coupable.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["overscroll", "1 · overscroll"],
              ["safearea", "2 · safe-area"],
              ["height", "3 · height 100%"],
              ["viewport", "4 · viewport-fit"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => lift(key)}
                className="rounded-lg text-xs font-medium"
                style={{ background: "#E0C97A", color: BASE.ink, minHeight: 44 }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => lift("all")}
              className="rounded-lg text-xs font-medium"
              style={{ background: "#6E9463", color: BASE.paper, minHeight: 44 }}
            >
              5 · tout lever
            </button>
            <button
              onClick={probe}
              className="rounded-lg text-xs font-medium"
              style={{ background: "#9BA98D", color: BASE.paper, minHeight: 44 }}
            >
              Analyser
            </button>
          </div>

          <pre className="mt-2 text-[10px] leading-snug whitespace-pre-wrap break-words" style={{ color: BASE.ink, maxHeight: 220, overflowY: "auto" }}>
            {log.length ? log.join("\n") : "Touche le champ « Nom », puis lis ici ce qui s'est passé."}
          </pre>
        </div>

        <Label>Type</Label>
        <Segmented options={TYPES} value={form.type} onChange={(type) => set({ type })} disabled={editing} />
        {editing && (
          <p className="text-xs mt-2" style={{ color: BASE.muted }}>
            Le type ne peut pas changer : l'historique déjà enregistré ne serait plus lisible.
          </p>
        )}

        {form.type === "count" && (
          <>
            <Label>Objectif</Label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={form.target}
                onChange={(e) => set({ target: e.target.value })}
                placeholder="8000"
                aria-label="Objectif chiffré"
                className="w-1/2 rounded-xl px-3 outline-none"
                style={{ ...inputStyle, minHeight: 44 }}
              />
              <input
                value={form.unit}
                onChange={(e) => set({ unit: e.target.value })}
                placeholder="pas, L, min…"
                aria-label="Unité"
                className="w-1/2 rounded-xl px-3 outline-none"
                style={{ ...inputStyle, minHeight: 44 }}
              />
            </div>
          </>
        )}

        {form.type === "multi" && (
          <>
            <Label>Moments de la journée</Label>
            <div className="space-y-2">
              {form.periods.map((p, i) => (
                <div key={p.id} className="flex gap-2 items-center">
                  <input
                    value={p.label}
                    onChange={(e) => setPeriod(i, e.target.value)}
                    placeholder={`Moment ${i + 1}`}
                    aria-label={`Moment ${i + 1}`}
                    className="flex-1 rounded-xl px-3 outline-none"
                    style={{ ...inputStyle, minHeight: 44 }}
                  />
                  <button
                    onClick={() => removePeriod(i)}
                    aria-label={`Retirer le moment ${i + 1}`}
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ border: `1px solid ${BASE.line}`, color: BASE.danger }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPeriod}
              className="w-full mt-2 rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
              style={{ border: `1.5px dashed ${BASE.stem}`, color: PALETTE[1].deep, minHeight: 44 }}
            >
              <Plus size={15} /> Ajouter un moment
            </button>
          </>
        )}

        <Label>Fréquence</Label>
        <Segmented options={FREQS} value={form.freqKind} onChange={(freqKind) => set({ freqKind })} />

        {form.freqKind === FREQ_WEEKDAYS && (
          <div className="flex gap-1.5 mt-3">
            {DAY_ORDER.map((d) => {
              const on = form.freqDays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className="flex-1 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                  style={{
                    background: on ? PALETTE[1].deep : BASE.paper,
                    color: on ? BASE.paper : BASE.ink,
                    border: `1px solid ${on ? PALETTE[1].deep : BASE.line}`,
                    minHeight: 44,
                  }}
                >
                  {DOW[d]}
                </button>
              );
            })}
          </div>
        )}

        {form.freqKind === FREQ_PER_WEEK && (
          <div className="flex items-center justify-between mt-3 rounded-xl px-3 py-2" style={{ background: BASE.paperDeep }}>
            <span className="text-sm">{form.freqTimes} fois par semaine</span>
            <div className="flex gap-2">
              <button
                onClick={() => set({ freqTimes: Math.max(1, form.freqTimes - 1) })}
                aria-label="Moins souvent"
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ border: `1px solid ${BASE.stem}` }}
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => set({ freqTimes: Math.min(7, form.freqTimes + 1) })}
                aria-label="Plus souvent"
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ border: `1px solid ${BASE.stem}` }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        <Label>Icône</Label>
        <div className="flex gap-2">
          {ICON_KEYS.map((k) => {
            const Icon = ICONS[k];
            const on = form.icon === k;
            return (
              <button
                key={k}
                onClick={() => set({ icon: k })}
                aria-label={k}
                aria-pressed={on}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: on ? PALETTE[1].deep : BASE.paper, color: on ? BASE.paper : BASE.ink, border: `1px solid ${on ? PALETTE[1].deep : BASE.line}` }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {problem && <p className="text-sm mt-4" style={{ color: BASE.danger }}>{problem}</p>}

        <button
          onClick={submit}
          className="w-full rounded-2xl mt-5 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          style={{ background: PALETTE[3].deep, color: BASE.paper, minHeight: 48 }}
        >
          {editing ? <><Check size={15} /> Enregistrer</> : <><Sparkles size={15} /> Ajouter</>}
        </button>
      </div>
    </div>
  );
}
