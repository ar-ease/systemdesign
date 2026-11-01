"use client";

import { useProgress } from "@/lib/progress";

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Last 12 weeks of activity, GitHub-style. Columns are weeks (Sun→Sat). */
export default function Heatmap() {
  const { p } = useProgress();
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay() - 7 * 11); // Sunday, 11 weeks before this week
  const days: { k: string; n: number; future: boolean }[] = [];
  for (let i = 0; i < 7 * 12; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ k: key(d), n: p.activity[key(d)] ?? 0, future: d > end });
  }
  const lvl = (n: number) => (n === 0 ? "" : n < 3 ? "l1" : n < 8 ? "l2" : "l3");
  return (
    <div style={{ overflowX: "auto" }}>
      <div className="heat">
        {days.map((d) => (
          <div key={d.k} className={lvl(d.n)} title={`${d.k}: ${d.n} actions`} style={d.future ? { opacity: 0.3 } : undefined} />
        ))}
      </div>
    </div>
  );
}
