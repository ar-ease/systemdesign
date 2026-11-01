"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { levelByNum } from "@/lib/data";
import Bar from "@/components/Bar";

type Props = { href: string; kind: "sys" | "db"; id: string; title: string; blurb: string; level: string; difficulty: string; steps: number };

export default function PuzzleCard({ href, kind, id, title, blurb, level, difficulty, steps }: Props) {
  const { p } = useProgress();
  const done = Array.from({ length: steps }, (_, i) => p.studio?.[`${kind}:${id}:${i}`]).filter(Boolean).length;
  return (
    <Link href={href} className={`card tight level-tile ${done === steps ? "cleared" : ""}`}>
      <div className="row spread">
        <span className="level-num">{kind === "sys" ? "🧩 SYSTEM" : "🗄️ DATABASE"} · L{level}</span>
        {done === steps ? <span className="pill good">✓ done</span> : <span className={`pill ${difficulty === "Starter" ? "good" : difficulty === "Core" ? "accent" : "warn"}`}>{difficulty}</span>}
      </div>
      <h3 style={{ margin: "8px 0 4px" }}>{title}</h3>
      <p className="muted small" style={{ minHeight: 40 }}>{blurb}</p>
      <Bar pct={(done / steps) * 100} kind={done === steps ? "good" : undefined} />
      <div className="row spread small muted" style={{ marginTop: 6 }}><span>{done}/{steps} steps</span><span>{levelByNum(level).title}</span></div>
    </Link>
  );
}
