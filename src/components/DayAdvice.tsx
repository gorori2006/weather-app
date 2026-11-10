import type { Advice } from "@/lib/advice";

export function DayAdvice({ title, items }: { title: string; items: Advice[] }) {
  if (items.length === 0) return null;
  const [main, ...rest] = items;
  return (
    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40">
      <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">{title}</p>
      <p className="mt-1 flex gap-2 font-semibold text-slate-900 dark:text-slate-100">
        <span aria-hidden>{main.icon}</span>
        <span>{main.text}</span>
      </p>
      {rest.length > 0 && (
        <ul className="mt-1.5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {rest.map((a) => (
            <li key={a.text} className="flex gap-2">
              <span aria-hidden>{a.icon}</span>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
