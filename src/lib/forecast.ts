import type { OwmForecast } from "./openweather";
import type { DailyForecast, HourlyForecast } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** UNIX 秒 + タイムゾーンオフセット → 現地の日付・時刻 */
function toLocal(dt: number, tzOffset: number) {
  const d = new Date((dt + tzOffset) * 1000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    hour: d.getUTCHours(),
  };
}

/** 3時間ごとの予報を現地日付ごとにまとめる */
export function groupByDay(forecast: OwmForecast): DailyForecast[] {
  const tz = forecast.city.timezone;
  const map = new Map<string, { hours: (HourlyForecast & { hour: number })[]; min: number; max: number }>();

  for (const item of forecast.list) {
    const { date, time, hour } = toLocal(item.dt, tz);
    const entry = map.get(date) ?? { hours: [], min: Infinity, max: -Infinity };
    entry.hours.push({
      dt: item.dt,
      time,
      hour,
      temp: Math.round(item.main.temp),
      humidity: item.main.humidity,
      pop: Math.round(item.pop * 100),
      description: item.weather[0]?.description ?? "",
      icon: item.weather[0]?.icon ?? "01d",
    });
    entry.min = Math.min(entry.min, item.main.temp_min);
    entry.max = Math.max(entry.max, item.main.temp_max);
    map.set(date, entry);
  }

  return [...map.entries()].map(([date, { hours, min, max }]) => {
    // 代表天気は正午に最も近い時間帯のもの
    const rep = hours.reduce((a, b) => (Math.abs(b.hour - 12) < Math.abs(a.hour - 12) ? b : a));
    return {
      date,
      tempMax: Math.round(max),
      tempMin: Math.round(min),
      humidity: Math.round(hours.reduce((s, h) => s + h.humidity, 0) / hours.length),
      pop: Math.max(...hours.map((h) => h.pop)),
      description: rep.description,
      icon: rep.icon.replace("n", "d"),
      hours: hours.map(({ hour, ...h }) => (void hour, h)),
    };
  });
}
