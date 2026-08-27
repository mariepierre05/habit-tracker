import React, { useState } from "react";
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
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(58,52,44,0.35)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[28px] p-5 pb-8"
        style={{ background: BASE.paper, maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
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
          className="w-full rounded-xl px-3 text-sm outline-none"
          style={{ ...inputStyle, minHeight: 44 }}
        />

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
                className="w-1/2 rounded-xl px-3 text-sm outline-none"
                style={{ ...inputStyle, minHeight: 44 }}
              />
              <input
                value={form.unit}
                onChange={(e) => set({ unit: e.target.value })}
                placeholder="pas, L, min…"
                aria-label="Unité"
                className="w-1/2 rounded-xl px-3 text-sm outline-none"
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
                    className="flex-1 rounded-xl px-3 text-sm outline-none"
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
