"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { HourlyForecast } from "@/lib/types";

// 気温（折れ線）と降水確率（棒）は単位が違うため、2軸の1グラフにはせず
// 上下 2 段のグラフに分け、時間軸とホバーを共有する。

const PAD = { left: 36, right: 12 };
const TEMP_H = 162;
const POP_H = 96;
const TOP = 30; // 「現在」ラベルと最高気温ラベル用の余白
const BOTTOM = 6;
const AXIS_H = 20; // 時刻ラベル

function niceStep(range: number) {
  const raw = range / 3;
  for (const s of [1, 2, 5, 10, 20]) if (raw <= s) return s;
  return 20;
}

/** 現在時刻（1分ごとに更新） */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function HourlyChart({ hours }: { hours: HourlyForecast[] }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const now = useNow();

  const n = hours.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);

  // ---- 時間軸 ----
  // 各点は 3 時間枠の中央。予報の最初の点は「次の 3 時間枠」なので、今日のグラフでは
  // 現在時刻が最初の点より前にあることが多い。そのときは軸を現在時刻まで左に広げる。
  const SLOT = 3 * 3600;
  const nowSec = now / 1000;
  const first = n > 0 ? hours[0].dt : 0;
  const last = n > 0 ? hours[n - 1].dt : 0;
  const showNow = n > 0 && nowSec >= first - SLOT - 60 && nowSec <= last + SLOT / 2;
  // 現在線が縦軸に重ならないよう、左に 30 分ぶんの余白を取る
  const tStart = showNow ? Math.min(first - SLOT / 2, nowSec - 1800) : first - SLOT / 2;
  const tEnd = last + SLOT / 2;
  const xAt = (t: number) => PAD.left + ((t - tStart) / (tEnd - tStart)) * plotW;
  const band = n > 0 ? (plotW * SLOT) / (tEnd - tStart) : 0;
  const cx = (i: number) => xAt(hours[i].dt);

  const nowX = showNow && plotW > 0 ? xAt(nowSec) : null;
  // 現地時刻の「HH:mm」（API の time と dt の差からタイムゾーンを求める）
  let nowLabel = "";
  if (nowX !== null) {
    const [hh, mm] = hours[0].time.split(":").map(Number);
    const utcMin = Math.floor(hours[0].dt / 60) % 1440;
    const offsetMin = (((hh * 60 + mm - utcMin) % 1440) + 1440) % 1440;
    const local = (Math.floor(nowSec / 60) + offsetMin) % 1440;
    nowLabel = `${String(Math.floor(local / 60)).padStart(2, "0")}:${String(local % 60).padStart(2, "0")}`;
  }
  const nowLine = (y1: number, y2: number) =>
    nowX !== null && (
      <line x1={nowX} x2={nowX} y1={y1} y2={y2} className="stroke-[var(--chart-now)]" strokeWidth={1.5} />
    );

  // ---- 気温スケール ----
  const temps = hours.map((h) => h.temp);
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const step = niceStep(Math.max(tMax - tMin, 2));
  const lo = Math.floor((tMin - 1) / step) * step;
  const hi = Math.ceil((tMax + 1) / step) * step;
  const tempTicks: number[] = [];
  for (let v = lo; v <= hi; v += step) tempTicks.push(v);
  const tempPlotH = TEMP_H - TOP - BOTTOM;
  const ty = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * tempPlotH;

  const linePath = hours.map((h, i) => `${i ? "L" : "M"}${cx(i)},${ty(h.temp)}`).join(" ");
  const areaPath =
    n > 1 ? `${linePath} L${cx(n - 1)},${ty(lo)} L${cx(0)},${ty(lo)} Z` : "";
  const iMax = temps.indexOf(tMax);
  const iMin = temps.lastIndexOf(tMin);

  // ---- 降水確率スケール (0-100%) ----
  const popPlotH = POP_H - 8 - BOTTOM;
  const py = (v: number) => 8 + (1 - v / 100) * popPlotH;
  const barW = Math.min(24, Math.max(4, band - 2 - band * 0.4));

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const hoverLayer = (h: number) =>
    hours.map((_, i) => (
      <rect
        key={i}
        x={cx(i) - band / 2}
        y={0}
        width={band}
        height={h}
        fill="transparent"
        onPointerEnter={() => setActive(i)}
        onPointerDown={() => setActive(i)}
      />
    ));

  const crosshair = (h: number) =>
    active !== null && (
      <line x1={cx(active)} x2={cx(active)} y1={0} y2={h} className="stroke-[var(--chart-axis)]" strokeWidth={1} />
    );

  const tip = active !== null ? hours[active] : null;
  // ツールチップは線を隠さないよう、十字線の横（右に入らなければ左）に出す
  const TIP_W = 136;
  const tipLeft =
    active === null
      ? 0
      : cx(active) + 12 + TIP_W <= width
        ? cx(active) + 12
        : Math.max(0, cx(active) - 12 - TIP_W);

  return (
    <div
      ref={wrapRef}
      className="relative mt-5 w-full min-w-0 select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      tabIndex={0}
      role="group"
      aria-label="3時間ごとの気温と降水確率のグラフ。左右の矢印キーで時間を選べます。"
      onKeyDown={onKey}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      {width > 0 && n > 0 && (
        <>
          {/* 気温 */}
          <h3 className="mb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">気温（°C）</h3>
          <svg className="block" width={width} height={TEMP_H} role="img" aria-label={`気温 最高${tMax}°C 最低${tMin}°C`}>
            {tempTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={ty(v)} y2={ty(v)} className="stroke-[var(--chart-grid)]" strokeWidth={1} />
                <text x={PAD.left - 6} y={ty(v)} dy="0.35em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                  {v}
                </text>
              </g>
            ))}
            {crosshair(TEMP_H)}
            {nowLine(TOP - 12, TEMP_H)}
            {nowX !== null && (
              <text
                x={nowX + (nowX > width - 90 ? -6 : 6)}
                y={12}
                textAnchor={nowX > width - 90 ? "end" : "start"}
                className="fill-slate-700 text-[11px] font-semibold tabular-nums dark:fill-slate-200"
              >
                現在 {nowLabel}
              </text>
            )}
            {nowX !== null && <circle cx={nowX} cy={TOP - 12} r={3} className="fill-[var(--chart-now)]" />}
            {areaPath && <path d={areaPath} className="fill-[var(--chart-temp)]" fillOpacity={0.1} />}
            {n > 1 && (
              <path d={linePath} fill="none" className="stroke-[var(--chart-temp)]" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            )}
            {hours.map((h, i) => (
              <circle
                key={h.dt}
                cx={cx(i)}
                cy={ty(h.temp)}
                r={active === i ? 5 : 4}
                className="fill-[var(--chart-temp)] stroke-[var(--chart-surface)]"
                strokeWidth={2}
              />
            ))}
            {/* 直接ラベルは最高・最低のみ */}
            <text x={cx(iMax)} y={ty(tMax) - 9} textAnchor="middle" className="fill-slate-800 text-xs font-semibold tabular-nums dark:fill-slate-100">
              {tMax}°
            </text>
            {iMin !== iMax && (
              <text x={cx(iMin)} y={ty(tMin) + 18} textAnchor="middle" className="fill-slate-800 text-xs font-semibold tabular-nums dark:fill-slate-100">
                {tMin}°
              </text>
            )}
            {hoverLayer(TEMP_H)}
          </svg>

          {/* 降水確率 */}
          <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">降水確率（%）</h3>
          <svg className="block" width={width} height={POP_H + AXIS_H} role="img" aria-label={`降水確率 最大${Math.max(...hours.map((h) => h.pop))}%`}>
            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={py(v)} y2={py(v)} className="stroke-[var(--chart-grid)]" strokeWidth={1} />
                <text x={PAD.left - 6} y={py(v)} dy="0.35em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                  {v}
                </text>
              </g>
            ))}
            {crosshair(POP_H)}
            {nowLine(0, POP_H)}
            {hours.map((h, i) => {
              const top = py(h.pop);
              const hgt = py(0) - top;
              if (hgt <= 0) return null;
              const r = Math.min(4, hgt, barW / 2);
              const x = cx(i) - barW / 2;
              // 上端だけ角丸、基準線側は四角
              const d = `M${x},${py(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${py(0)} Z`;
              return (
                <path key={h.dt} d={d} className="fill-[var(--chart-pop)]" opacity={active === null || active === i ? 1 : 0.55} />
              );
            })}
            {hours.map((h, i) => (
              <text key={h.dt} x={cx(i)} y={POP_H + 14} textAnchor="middle" className="fill-slate-500 text-[11px] tabular-nums dark:fill-slate-400">
                {h.time.slice(0, 2)}時
              </text>
            ))}
            {hoverLayer(POP_H + AXIS_H)}
          </svg>

          {/* ツールチップ：その時間のすべての値 */}
          {tip && (
            <div
              className="pointer-events-none absolute top-6 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-600 dark:bg-slate-800"
              style={{ left: tipLeft, width: TIP_W }}
              aria-live="polite"
            >
              <div className="mb-1 font-semibold text-slate-500 dark:text-slate-400">{tip.time}</div>
              <TipRow color="var(--chart-temp)" value={`${tip.temp}°C`} label="気温" />
              <TipRow color="var(--chart-pop)" value={`${tip.pop}%`} label="降水確率" />
              <TipRow value={`${tip.humidity}%`} label="湿度" />
              <div className="mt-0.5 text-slate-500 dark:text-slate-400">{tip.description}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TipRow({ color, value, label }: { color?: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-block h-0.5 w-3 rounded" style={{ background: color ?? "transparent" }} />
      <span className="text-sm font-bold text-slate-900 tabular-nums dark:text-slate-100">{value}</span>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
