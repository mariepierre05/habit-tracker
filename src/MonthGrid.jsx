import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BASE, PALETTE, withAlpha } from "./theme";
import { DOW, monthCells, monthLabel, addMonths, fromISO, startOfMonth } from "./dates";
import { isDone, isRequiredOn } from "./habits";

const HEADER = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

// Same rule as the weekly buds: a day is measured only against the habits it
// actually asked for, so a rest day never reads as an empty failure.
function ratioFor(habits, entries, iso) {
  const required = habits.filter((h) => isRequiredOn(h, iso));
  if (required.length === 0) return null;
  const vals = entries[iso] || {};
  return required.filter((h) => isDone(h, vals[h.id])).length / required.length;
}

export default function MonthGrid({ habits, entries, month, today, activeDate, onPickDay, onChangeMonth }) {
  const cells = monthCells(month);
  const atCurrentMonth = startOfMonth(month) === startOfMonth(today);

  return (
    <div className="rounded-2xl p-2" style={{ background: BASE.paperDeep }}>
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => onChangeMonth(addMonths(month, -1))}
          aria-label="Mois précédent"
          className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium capitalize" style={{ fontFamily: "'Fraunces', serif" }}>{monthLabel(month)}</p>
        <button
          onClick={() => onChangeMonth(addMonths(month, 1))}
          disabled={atCurrentMonth}
          aria-label="Mois suivant"
          className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-25"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {HEADER.map((d) => (
          <p key={d} className="text-center text-xs pb-1" style={{ color: BASE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{d}</p>
        ))}

        {cells.map((iso, i) => {
          if (!iso) return <div key={`pad-${i}`} style={{ minHeight: 44 }} />;
          const future = iso > today;
          const ratio = future ? null : ratioFor(habits, entries, iso);
          const isToday = iso === today;
          const selected = iso === activeDate;
          const filled = ratio !== null && ratio > 0;
          return (
            <button
              key={iso}
              onClick={() => onPickDay(iso)}
              disabled={future}
              aria-label={`Compléter ${fromISO(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
              aria-pressed={selected}
              className="flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
              style={{ minHeight: 44 }}
            >
              <span
                className="flex items-center justify-center rounded-lg text-xs"
                style={{
                  width: "82%",
                  height: "82%",
                  // Shading by completion keeps a whole month readable at a glance.
                  background: filled ? withAlpha(PALETTE[1].deep, 0.2 + ratio * 0.8) : BASE.paper,
                  color: filled && ratio > 0.55 ? BASE.paper : BASE.ink,
                  fontWeight: isToday || selected ? 700 : 400,
                  boxShadow: selected
                    ? `0 0 0 2px ${PALETTE[3].deep}`
                    : isToday
                      ? `0 0 0 2px ${BASE.stem}`
                      : "none",
                  transition: "background 0.2s ease",
                }}
              >
                {fromISO(iso).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
