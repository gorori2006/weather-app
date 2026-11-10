import type { DailyForecast } from "./types";

export type Advice = {
  /** 表示用の絵文字 */
  icon: string;
  text: string;
};

const hourOf = (time: string) => Number(time.slice(0, 2));
const isSnow = (desc: string) => desc.includes("雪");

/**
 * その日の予報から「ひとこと」を作る（優先度順に最大 3 件）。
 * 優先度: 雨・雪 > 暑さ・寒さ > 寒暖差 > 前日/翌日との比較 > 雨の心配なし
 *
 * @param prev 前日の予報（比較用。なければ undefined）
 * @param next 翌日の予報（今日を見ているとき「明日は〜」と比較するため）
 * @param isToday 今日の予報かどうか
 */
export function buildAdvice(
  day: DailyForecast,
  { prev, next, isToday }: { prev?: DailyForecast; next?: DailyForecast; isToday: boolean },
): Advice[] {
  const out: Advice[] = [];
  const hours = day.hours;
  if (hours.length === 0) return out;

  // 今日の残り時間が短い（3枠未満）と最高・最低気温が一日を代表しないので、気温の比較系は出さない
  const fullDay = hours.length >= 4;
  const scope = isToday && !fullDay ? "このあと" : "";

  // ---- 雨・雪 ----
  const snowy = hours.some((h) => isSnow(h.description));
  const rainy = hours.filter((h) => h.pop >= 50);
  if (rainy.length > 0) {
    const start = hourOf(rainy[0].time);
    const end = hourOf(rainy[rainy.length - 1].time) + 3;
    const allDay = rainy.length === hours.length;
    const when = allDay
      ? scope
        ? "このあとは"
        : "一日を通して"
      : fullDay && end - start >= 15
        ? "ほぼ一日を通して"
        : end - start <= 3
          ? `${start}時ごろに`
        : end >= 24
          ? `${start}時ごろから夜にかけて`
          : `${start}時〜${end}時ごろに`;
    out.push(
      snowy
        ? { icon: "❄️", text: `${when}雪の可能性（最大${day.pop}%）。足元に気をつけて` }
        : { icon: "☔", text: `${when}雨の可能性（最大${day.pop}%）。傘を持っていくと安心` },
    );
  } else if (day.pop >= 30) {
    const peak = hours.reduce((a, b) => (b.pop > a.pop ? b : a));
    out.push({ icon: "🌂", text: `${hourOf(peak.time)}時ごろに少し降るかも（${peak.pop}%）。折りたたみ傘があると安心` });
  } else if (snowy) {
    out.push({ icon: "❄️", text: "雪の予報。足元に気をつけて" });
  }
  // 「雨の心配なし」は優先度が低いので、ほかに伝えることがなければ最後に入れる
  const noRain =
    rainy.length === 0 && day.pop < 30 && !snowy
      ? { icon: "🌤️", text: `${scope ? "このあとは" : ""}雨の心配はなさそう` }
      : null;

  // ---- 暑さ・寒さ ----
  if (day.tempMax >= 35) out.push({ icon: "🥵", text: `最高${day.tempMax}°Cの猛暑。外出はなるべく控えて、こまめに水分補給を` });
  else if (day.tempMax >= 30) out.push({ icon: "💧", text: `最高${day.tempMax}°Cの真夏日。こまめに水分補給を` });
  else if (day.tempMin <= 0) out.push({ icon: "🧤", text: `最低${day.tempMin}°Cの冷え込み。手袋やマフラーがあると安心` });
  else if (day.tempMax <= 10) out.push({ icon: "🧥", text: `最高${day.tempMax}°Cと寒い一日。厚手の上着を` });

  // ---- 寒暖差 ----
  const range = day.tempMax - day.tempMin;
  if (fullDay && range >= 8) {
    out.push({ icon: "🌡️", text: `朝晩と日中の気温差が${range}°C。脱ぎ着しやすい服装で` });
  }

  // ---- 前日・翌日との比較（最高気温） ----
  if (fullDay && prev && prev.hours.length >= 4) {
    const diff = day.tempMax - prev.tempMax;
    if (Math.abs(diff) >= 3) {
      out.push({ icon: diff > 0 ? "⬆️" : "⬇️", text: `前日より最高気温が${Math.abs(diff)}°C${diff > 0 ? "高い" : "低い"}` });
    }
  }
  // 今日のカードでは、先頭は今日の情報にしたいので「明日は〜」は最後に回す
  let tomorrow: Advice | null = null;
  if (!(fullDay && prev && prev.hours.length >= 4) && isToday && next && next.hours.length >= 4) {
    // 今日は前日のデータがないので、明日との比較を出す
    const nextRainy = next.pop >= 50;
    const diff = fullDay ? next.tempMax - day.tempMax : 0;
    if (Math.abs(diff) >= 3) {
      tomorrow = { icon: diff > 0 ? "⬆️" : "⬇️", text: `明日は今日より最高気温が${Math.abs(diff)}°C${diff > 0 ? "高い" : "低い"}予報` };
    } else if (nextRainy && rainy.length === 0) {
      tomorrow = { icon: "☔", text: `明日は雨の可能性（最大${next.pop}%）` };
    }
  }

  if (noRain && out.length < 3) out.push(noRain);
  if (tomorrow) out.push(tomorrow);
  return out.slice(0, 3);
}
