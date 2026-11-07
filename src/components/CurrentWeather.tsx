import type { CurrentWeather as Current, Location } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";

type Props = { location: Location; current: Current; todayPop?: number };

export function CurrentWeather({ location, current, todayPop }: Props) {
  const d = new Date((current.dt + location.timezone) * 1000);
  const observed = `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {location.name}
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">{location.country}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">現在の天気（現地時刻 {observed} 観測）</p>
        </div>
        <WeatherIcon icon={current.icon} alt={current.description} size={72} />
      </div>

      <div className="mt-2 flex items-end gap-3">
        <span className="text-6xl font-bold tabular-nums">{current.temp}°</span>
        <span className="pb-2 text-lg">{current.description}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="体感温度" value={`${current.feelsLike}°C`} />
        <Stat label="湿度" value={`${current.humidity}%`} />
        <Stat label="降水確率(次の3時間)" value={todayPop !== undefined ? `${todayPop}%` : "—"} />
        <Stat label="風速" value={`${current.windSpeed.toFixed(1)} m/s`} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-slate-700/50">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
