type Props = { icon: string; alt: string; size?: number };

export function WeatherIcon({ icon, alt, size = 64 }: Props) {
  return (
    // OpenWeatherMap 公式アイコン（静的な小画像のため next/image の最適化は不要）
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={alt}
      width={size}
      height={size}
      className="drop-shadow"
    />
  );
}
