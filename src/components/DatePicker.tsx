"use client";

import { useState } from "react";

type Props = {
  /** 選択可能な日付 "YYYY-MM-DD"（予報がある日） */
  availableDates: string[];
  selected: string;
  today: string;
  onSelect: (date: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function DatePicker({ availableDates, selected, today, onSelect }: Props) {
  const [sy, sm] = selected.split("-").map(Number);
  const [view, setView] = useState({ year: sy, month: sm - 1 });
  const available = new Set(availableDates);

  // 予報がある月の範囲内だけ移動できる
  const months = [...new Set(availableDates.map((d) => d.slice(0, 7)))].sort();
  const viewKey = `${view.year}-${pad(view.month + 1)}`;
  const canPrev = months.length > 0 && viewKey > months[0];
  const canNext = months.length > 0 && viewKey < months[months.length - 1];

  const move = (delta: number) => {
    const d = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="前の月"
          className="rounded-lg px-3 py-1 text-lg hover:bg-sky-100 disabled:invisible dark:hover:bg-slate-700"
        >
          ‹
        </button>
        <h2 className="font-bold">
          {view.year}年 {view.month + 1}月
        </h2>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canNext}
          aria-label="次の月"
          className="rounded-lg px-3 py-1 text-lg hover:bg-sky-100 disabled:invisible dark:hover:bg-slate-700"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm" role="grid">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-xs font-semibold ${i === 0 ? "text-rose-500" : i === 6 ? "text-sky-600" : "text-slate-500 dark:text-slate-400"}`}
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const k = key(view.year, view.month, day);
          const enabled = available.has(k);
          const isSelected = k === selected;
          const isToday = k === today;
          return (
            <button
              key={k}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(k)}
              aria-pressed={isSelected}
              aria-label={`${view.month + 1}月${day}日${enabled ? "" : "（予報なし）"}`}
              className={[
                "aspect-square rounded-lg tabular-nums transition",
                isSelected
                  ? "bg-sky-600 font-bold text-white shadow"
                  : enabled
                    ? "bg-sky-50 font-semibold text-slate-800 hover:bg-sky-200 dark:bg-slate-700/60 dark:text-slate-100 dark:hover:bg-slate-600"
                    : "cursor-not-allowed text-slate-300 dark:text-slate-600",
                isToday && !isSelected ? "ring-2 ring-sky-400" : "",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        ※ 無料プランの予報は約5日先までです。選択できる日付のみ表示が切り替わります。
      </p>
    </section>
  );
}
