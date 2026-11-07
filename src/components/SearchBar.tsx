"use client";

import { useState } from "react";

type Props = {
  loading: boolean;
  onSearchCity: (city: string) => void;
  onSearchCoords: (lat: number, lon: number) => void;
  onError: (message: string) => void;
};

export function SearchBar({ loading, onSearchCity, onSearchCoords, onError }: Props) {
  const [city, setCity] = useState("");
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      onError("このブラウザは位置情報に対応していません。");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSearchCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        onError(
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません。ブラウザの設定を確認してください。"
            : "現在地を取得できませんでした。",
        );
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const busy = loading || locating;

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (city.trim()) onSearchCity(city.trim());
      }}
    >
      <input
        type="search"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="都市名を入力（例: 東京, Osaka, London）"
        aria-label="都市名"
        className="min-w-0 flex-1 rounded-xl border border-white/40 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !city.trim()}
          className="flex-1 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          検索
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={busy}
          className="flex-1 whitespace-nowrap rounded-xl border border-sky-600 bg-white/80 px-4 py-3 font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none dark:bg-slate-800/80 dark:text-sky-300 dark:hover:bg-slate-700"
        >
          {locating ? "取得中…" : "📍 現在地"}
        </button>
      </div>
    </form>
  );
}
