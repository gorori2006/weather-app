"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CurrentWeather } from "@/components/CurrentWeather";
import { DatePicker } from "@/components/DatePicker";
import { DayForecast } from "@/components/DayForecast";
import type { ErrorResponse, WeatherResponse } from "@/lib/types";

/** 指定タイムゾーンオフセットでの今日の日付 "YYYY-MM-DD" */
function localToday(tzOffset: number) {
  return new Date(Date.now() + tzOffset * 1000).toISOString().slice(0, 10);
}

export default function Home() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (query: URLSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?${query}`);
      const json = (await res.json()) as WeatherResponse | ErrorResponse;
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : "天気情報の取得に失敗しました。");
      }
      setData(json);
      const today = localToday(json.location.timezone);
      setSelected(json.days.some((d) => d.date === today) ? today : (json.days[0]?.date ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "天気情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const today = data ? localToday(data.location.timezone) : "";
  const selectedDay = data?.days.find((d) => d.date === selected);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">☀️ お天気ナビ</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          都市名または現在地から、気温・天気・湿度・降水確率をチェック
        </p>
      </header>

      <SearchBar
        loading={loading}
        onSearchCity={(city) => load(new URLSearchParams({ city }))}
        onSearchCoords={(lat, lon) => load(new URLSearchParams({ lat: String(lat), lon: String(lon) }))}
        onError={setError}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-10 text-slate-500" aria-live="polite">
          <span className="h-6 w-6 animate-spin rounded-full border-4 border-sky-300 border-t-sky-600" />
          読み込み中…
        </div>
      )}

      {!loading && data && (
        <>
          <CurrentWeather
            location={data.location}
            current={data.current}
            todayPop={data.days[0]?.hours[0]?.pop}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <DatePicker
              key={`${data.location.lat},${data.location.lon}`}
              availableDates={data.days.map((d) => d.date)}
              selected={selected}
              today={today}
              onSelect={setSelected}
            />
            {selectedDay && (
              <DayForecast
                day={selectedDay}
                today={today}
                prev={data.days[data.days.indexOf(selectedDay) - 1]}
                next={data.days[data.days.indexOf(selectedDay) + 1]}
              />
            )}
          </div>
        </>
      )}

      {!loading && !data && !error && (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">
          都市名を入力するか「現在地」ボタンを押してください。
        </p>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Weather data provided by{" "}
        <a href="https://openweathermap.org/" target="_blank" rel="noreferrer" className="underline">
          OpenWeatherMap
        </a>
      </footer>
    </main>
  );
}
