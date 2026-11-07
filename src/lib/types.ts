// クライアント・サーバー共通で使う整形済みデータの型

export type Location = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** UTC からのオフセット（秒） */
  timezone: number;
};

export type CurrentWeather = {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  /** UNIX 秒 */
  dt: number;
};

export type HourlyForecast = {
  /** UNIX 秒 */
  dt: number;
  /** 現地時刻 "HH:mm" */
  time: string;
  temp: number;
  humidity: number;
  /** 降水確率 0-100 (%) */
  pop: number;
  description: string;
  icon: string;
};

export type DailyForecast = {
  /** 現地日付 "YYYY-MM-DD" */
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  pop: number;
  description: string;
  icon: string;
  hours: HourlyForecast[];
};

export type WeatherResponse = {
  location: Location;
  current: CurrentWeather;
  days: DailyForecast[];
};

export type ErrorResponse = { error: string };
