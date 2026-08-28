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

  // Editing is triggered from a card that may be far above the form.
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // TEMPORARY. The name field can't be tapped on one reporter's iPhone while
  // the time field in the reminder sheet works, which rules out the theories
  // tried so far. This records what the device actually delivers on a tap —
  // which element is hit, what sits at those coordinates, whether focus lands.
  // Remove once the cause is known.
  const [log, setLog] = useState([]);
  const [probeText, setProbeText] = useState("");
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const describe = (n) => {
      if (!n || !n.tagName) return String(n);
      const label = n.getAttribute && n.getAttribute("aria-label");
      const cls = typeof n.className === "string" && n.className ? "." + n.className.split(" ").slice(0, 2).join(".") : "";
      return `${n.tagName.toLowerCase()}${label ? `[${label}]` : ""}${cls}`;
    };
    const onEvent = (e) => {
      const pt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      const x = Math.round(pt.clientX != null ? pt.clientX : -1);
      const y = Math.round(pt.clientY != null ? pt.clientY : -1);
      const under = x >= 0 && y >= 0 ? document.elementFromPoint(x, y) : null;
      const line = `${e.type} · cible=${describe(e.target)}` + (x >= 0 ? ` · (${x},${y}) → ${describe(under)}` : "");
      setLog((l) => [line, ...l].slice(0, 12));
    };
    // Listening on the document, not the panel: a tap that lands somewhere
    // unexpected has to show up too, and one scoped to the panel would miss it.
    const events = ["touchstart", "pointerdown", "mousedown", "focusin", "click"];
    events.forEach((ev) => document.addEventListener(ev, onEvent, true));
    return () => events.forEach((ev) => document.removeEventListener(ev, onEvent, true));
  }, []);

  function probe() {
    const input = panelRef.current?.querySelector('input[aria-label="Nom de l\'habitude"]');
    if (!input) return;
    const r = input.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    const under = document.elementFromPoint(cx, cy);
    const cs = getComputedStyle(input);
    input.focus();
    const lines = [
      `champ: ${Math.round(r.width)}×${Math.round(r.height)} à (${Math.round(r.left)},${Math.round(r.top)})`,
      `au centre du champ: ${under && under.tagName ? under.tagName.toLowerCase() + (under.getAttribute("aria-label") ? "[" + under.getAttribute("aria-label") + "]" : "") : String(under)}`,
      `pointer-events=${cs.pointerEvents} user-select=${cs.webkitUserSelect || cs.userSelect} touch-action=${cs.touchAction}`,
      `readOnly=${input.readOnly} disabled=${input.disabled} opacity=${cs.opacity}`,
      `focus programmé → ${document.activeElement === input ? "OK" : "REFUSÉ"}`,
      `viewport ${window.innerWidth}×${window.innerHeight}, visual ${window.visualViewport ? Math.round(window.visualViewport.height) : "n/a"}`,
    ];
    setLog(lines);
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

        <Label>Nom</Label>
        <input
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ex : Lire 10 pages"
          aria-label="Nom de l'habitude"
          className="w-full rounded-xl px-3 outline-none"
          style={{ ...inputStyle, minHeight: 44 }}
        />

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

          <input
            aria-label="Témoin C"
            value={probeText}
            onChange={(e) => setProbeText(e.target.value)}
            placeholder="Témoin C — style du vrai champ"
            className="w-full rounded-xl px-3 outline-none"
            style={{ ...inputStyle, minHeight: 44, marginTop: 8 }}
          />

          <button
            onClick={probe}
            className="w-full mt-3 rounded-lg text-xs font-medium"
            style={{ background: "#E0C97A", color: BASE.ink, minHeight: 44 }}
          >
            Analyser le champ « Nom »
          </button>

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
