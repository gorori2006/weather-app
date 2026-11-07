import "server-only";
import { cacheLife } from "next/cache";

const BASE = "https://api.openweathermap.org";

export class WeatherApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** API キーは環境変数からのみ読み込む（.env.local）。コードには直書きしない。 */
function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new WeatherApiError(
      "サーバーに OPENWEATHER_API_KEY が設定されていません。.env.local を確認してください。",
      500,
    );
  }
  return key;
}

type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

async function request<T>(path: string, params: Record<string, string>, apiKey: string): Promise<Result<T>> {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url);
  if (res.ok) return { ok: true, data: (await res.json()) as T };

  const fail = (status: number, message: string) => ({ ok: false as const, status, message });
  if (res.status === 401) {
    return fail(502, "API キーが無効です（新規発行したキーは有効化まで数時間かかることがあります）。");
  }
  if (res.status === 404) return fail(404, "指定した場所が見つかりません。");
  if (res.status === 429) return fail(429, "API の呼び出し上限に達しました。しばらく待って再試行してください。");
  return fail(502, `天気 API でエラーが発生しました (${res.status})。`);
}

// "use cache" の境界を越えると Error のクラス・メッセージが失われる（本番では秘匿される）ため、
// キャッシュ対象の関数はエラーを throw せず値で返し、外側で WeatherApiError に変換する。
function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new WeatherApiError(r.message, r.status);
  return r.data;
}

// ---- OpenWeatherMap の生レスポンス型（必要な項目のみ） ----

type OwmWeather = { description: string; icon: string };

export type OwmGeo = {
  name: string;
  local_names?: Record<string, string>;
  country: string;
  lat: number;
  lon: number;
};

export type OwmCurrent = {
  dt: number;
  name: string;
  timezone: number;
  sys: { country: string };
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: OwmWeather[];
};

export type OwmForecast = {
  list: {
    dt: number;
    main: { temp: number; temp_min: number; temp_max: number; humidity: number };
    weather: OwmWeather[];
    pop: number;
  }[];
  city: { name: string; country: string; timezone: number };
};

// ---- API 呼び出し（キャッシュして無料枠の呼び出し回数を節約） ----
// キャッシュキーは引数から作られるため、API キーは引数に含めず内部で読む。

// 成功時は通常のキャッシュ期間、失敗時（キー無効など）は短時間だけキャッシュしてすぐ再試行できるようにする。

async function cachedGeocode(city: string) {
  "use cache";
  const r = await request<OwmGeo[]>("/geo/1.0/direct", { q: city, limit: "1" }, getApiKey());
  if (r.ok) cacheLife("hours");
  else cacheLife("seconds");
  return r;
}

async function cachedCurrent(lat: number, lon: number) {
  "use cache";
  const r = await request<OwmCurrent>(
    "/data/2.5/weather",
    { lat: String(lat), lon: String(lon), units: "metric", lang: "ja" },
    getApiKey(),
  );
  if (r.ok) cacheLife("minutes");
  else cacheLife("seconds");
  return r;
}

async function cachedForecast(lat: number, lon: number) {
  "use cache";
  const r = await request<OwmForecast>(
    "/data/2.5/forecast",
    { lat: String(lat), lon: String(lon), units: "metric", lang: "ja" },
    getApiKey(),
  );
  if (r.ok) cacheLife("minutes");
  else cacheLife("seconds");
  return r;
}

export async function geocode(city: string): Promise<OwmGeo | null> {
  getApiKey(); // 未設定ならキャッシュの外で分かりやすいエラーにする
  return unwrap(await cachedGeocode(city))[0] ?? null;
}

export async function fetchCurrent(lat: number, lon: number): Promise<OwmCurrent> {
  getApiKey();
  return unwrap(await cachedCurrent(lat, lon));
}

export async function fetchForecast(lat: number, lon: number): Promise<OwmForecast> {
  getApiKey();
  return unwrap(await cachedForecast(lat, lon));
}
