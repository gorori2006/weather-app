"use client";

import { useState } from "react";
import type { DailyForecast } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";

type Props = {
  /** 予報がある日（この日だけ選択でき、天気アイコンと最高気温を表示する） */
  days: DailyForecast[];
  selected: string;
  today: string;
  onSelect: (date: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function DatePicker({ days, selected, today, onSelect }: Props) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const availableDates = days.map((d) => d.date);
  const [sy, sm] = selected.split("-").map(Number);
  const [view, setView] = useState({ year: sy, month: sm - 1 });

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
          const fc = byDate.get(k);
          const enabled = fc !== undefined;
          const isSelected = k === selected;
          const isToday = k === today;
          return (
            <button
              key={k}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(k)}
              aria-pressed={isSelected}
              aria-label={
                fc
                  ? `${view.month + 1}月${day}日 ${fc.description} 最高${fc.tempMax}°C 最低${fc.tempMin}°C 降水確率${fc.pop}%`
                  : `${view.month + 1}月${day}日（予報なし）`
              }
              className={[
                `flex ${fc ? "min-h-16" : "min-h-10"} flex-col items-center justify-start rounded-lg pt-1.5 tabular-nums transition`,
                isSelected
                  ? "bg-sky-600 font-bold text-white shadow"
                  : enabled
                    ? "bg-sky-50 font-semibold text-slate-800 hover:bg-sky-200 dark:bg-slate-700/60 dark:text-slate-100 dark:hover:bg-slate-600"
                    : "cursor-not-allowed text-slate-300 dark:text-slate-600",
                isToday && !isSelected ? "ring-2 ring-sky-400" : "",
              ].join(" ")}
            >
              <span className="leading-tight">{day}</span>
              {fc && (
                <>
                  <span className="-my-1">
                    <WeatherIcon icon={fc.icon} alt="" size={30} />
                  </span>
                  <span className={`text-[11px] leading-none font-semibold ${isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                    {fc.tempMax}°
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        日付の下は天気と最高気温です。※ 無料プランの予報は約5日先までで、予報がある日だけ選べます。
      </p>
    </section>
  );
}
