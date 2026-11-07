import type { NextRequest } from "next/server";
import { WeatherApiError, fetchCurrent, fetchForecast, geocode } from "@/lib/openweather";
import { groupByDay } from "@/lib/forecast";
import type { ErrorResponse, WeatherResponse } from "@/lib/types";

const error = (message: string, status: number) =>
  Response.json({ error: message } satisfies ErrorResponse, { status });

// GET /api/weather?city=Tokyo  または  /api/weather?lat=35.68&lon=139.76
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const city = params.get("city")?.trim();
  const latParam = params.get("lat");
  const lonParam = params.get("lon");

  try {
    let lat: number;
    let lon: number;
    let displayName: string | undefined;

    if (city) {
      if (city.length > 100) return error("都市名が長すぎます。", 400);
      const geo = await geocode(city);
      if (!geo) return error(`「${city}」が見つかりませんでした。`, 404);
      lat = geo.lat;
      lon = geo.lon;
      displayName = geo.local_names?.ja ?? geo.name;
    } else if (latParam && lonParam) {
      lat = Number(latParam);
      lon = Number(lonParam);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return error("緯度・経度の値が不正です。", 400);
      }
      // キャッシュ効率のため小数2桁（約1km）に丸める
      lat = Math.round(lat * 100) / 100;
      lon = Math.round(lon * 100) / 100;
    } else {
      return error("city、または lat と lon を指定してください。", 400);
    }

    const [current, forecast] = await Promise.all([fetchCurrent(lat, lon), fetchForecast(lat, lon)]);

    const body: WeatherResponse = {
      location: {
        name: displayName ?? current.name ?? forecast.city.name,
        country: current.sys.country ?? forecast.city.country,
        lat,
        lon,
        timezone: forecast.city.timezone,
      },
      current: {
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        description: current.weather[0]?.description ?? "",
        icon: current.weather[0]?.icon ?? "01d",
        dt: current.dt,
      },
      days: groupByDay(forecast),
    };
    return Response.json(body);
  } catch (e) {
    if (e instanceof WeatherApiError) return error(e.message, e.status);
    console.error(e);
    return error("天気情報の取得に失敗しました。", 500);
  }
}
