import type { DailyForecast } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";
import { HourlyChart } from "./HourlyChart";
import { DayAdvice } from "./DayAdvice";
import { buildAdvice } from "@/lib/advice";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(date: string, today: string) {
  const [y, m, d] = date.split("-").map(Number);
  const w = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const label = date === today ? "今日" : "";
  return `${m}月${d}日（${w}）${label && ` · ${label}`}`;
}

type Props = {
  day: DailyForecast;
  today: string;
  /** 比較用の前日・翌日の予報 */
  prev?: DailyForecast;
  next?: DailyForecast;
};

export function DayForecast({ day, today, prev, next }: Props) {
  const isToday = day.date === today;
  const [, m, d] = day.date.split("-").map(Number);
  const advice = buildAdvice(day, { prev, next, isToday });
  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{formatDate(day.date, today)} の予報</h2>
          <p className="text-slate-600 dark:text-slate-300">{day.description}</p>
        </div>
        <WeatherIcon icon={day.icon} alt={day.description} />
      </div>

      <DayAdvice title={isToday ? "今日のひとこと" : `${m}/${d} のひとこと`} items={advice} />

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="最高気温" value={`${day.tempMax}°C`} className="text-rose-600 dark:text-rose-400" />
        <Summary label="最低気温" value={`${day.tempMin}°C`} className="text-sky-600 dark:text-sky-400" />
        <Summary label="降水確率(最大)" value={`${day.pop}%`} />
        <Summary label="平均湿度" value={`${day.humidity}%`} />
      </dl>

      <HourlyChart hours={day.hours} />

      <h3 className="mt-5 mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">3時間ごとの予報</h3>
      <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
        {day.hours.map((h) => (
          <li
            key={h.dt}
            className="flex w-24 shrink-0 snap-start flex-col items-center rounded-xl bg-sky-50 px-2 py-3 text-center dark:bg-slate-700/50"
          >
            <span className="text-sm font-semibold tabular-nums">{h.time}</span>
            <WeatherIcon icon={h.icon} alt={h.description} size={48} />
            <span className="text-lg font-bold tabular-nums">{h.temp}°</span>
            <span className="mt-1 text-xs text-sky-700 tabular-nums dark:text-sky-300" title="降水確率">
              ☔ {h.pop}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
              <span className="mr-0.5 text-[10px]">湿度</span>
              {h.humidity}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Summary({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-slate-700/50">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${className}`}>{value}</dd>
    </div>
  );
}
