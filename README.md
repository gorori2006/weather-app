# お天気ナビ

OpenWeatherMap（無料枠）を使った天気予報 Web アプリです。Next.js (App Router) + TypeScript + Tailwind CSS。

## 機能
- 都市名検索 / 📍現在地（ブラウザの位置情報）で天気を取得
- 現在の気温・体感温度・天気・湿度・降水確率・風速
- カレンダーで日付を選ぶと、その日の最高/最低気温・降水確率・湿度と 3 時間ごとの予報に切替
  - 無料プランの 5 day / 3 hour Forecast を使用するため、選べるのは今日〜約5日先まで

## セットアップ

1. [OpenWeatherMap](https://home.openweathermap.org/users/sign_up) でアカウントを作成し、[API keys](https://home.openweathermap.org/api_keys) からキーを取得
   - 新規キーは有効化まで数十分〜数時間かかることがあります
2. 環境変数ファイルを作成してキーを設定
   ```bash
   cp .env.example .env.local
   # .env.local を開いて OPENWEATHER_API_KEY=取得したキー を記入
   ```
3. 起動
   ```bash
   npm install
   npm run dev
   ```
   http://localhost:3000 を開きます。

## API キーの扱い
- キーは `.env.local` の `OPENWEATHER_API_KEY` からのみ読み込み、コードには書きません。
- `.env.local` は `.gitignore` で除外済み（`.env.example` のみコミット可）。
- `NEXT_PUBLIC_` を付けていないため、キーはブラウザに配信されません。ブラウザは自前の `/api/weather` を呼び、サーバー側（`src/lib/openweather.ts`、`server-only`）だけが OpenWeatherMap にアクセスします。
- Vercel などにデプロイする場合は、ダッシュボードの Environment Variables に同名で設定してください。

## 構成
```
src/app/api/weather/route.ts   サーバー側プロキシ（GET ?city= / ?lat=&lon=）
src/lib/openweather.ts         OpenWeatherMap 呼び出し（キャッシュ付き）
src/lib/forecast.ts            3時間予報 → 日別集計
src/components/                SearchBar / CurrentWeather / DatePicker / DayForecast
```
