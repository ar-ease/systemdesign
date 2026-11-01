"use client";

import Link from "next/link";
import { SYSTEMS, XP, levelByNum } from "@/lib/data";
import { PASS, levelStats, useProgress } from "@/lib/progress";

export default function Systems() {
  const { p } = useProgress();
  return (
    <div className="stack">
      <h1>Boss systems</h1>
      <p className="muted">Full 45-minute interview designs. Each one has <b>one hard problem</b>; name it in the first minute. +{XP.system} XP when you score ≥ {PASS}/10.</p>
      <div className="grid g3">
        {SYSTEMS.map((s) => {
          const score = p.systems[s.slug] ?? 0;
          const ready = s.unlock.every((n) => levelStats(p, levelByNum(n)).cleared);
          return (
            <Link key={s.slug} href={`/systems/${s.slug}`} className={`card tight level-tile ${score >= PASS ? "cleared" : ""}`}>
              <div className="row spread">
                <span className="level-num">{s.unlock.map((n) => `L${n}`).join(" + ")}</span>
                {score >= PASS ? <span className="pill good">👑 {score}/10</span> : ready ? <span className="pill accent">ready</span> : <span className="pill">🔒 recommended later</span>}
              </div>
              <h3 style={{ margin: "8px 0 4px" }}>{s.title}</h3>
              <p className="muted small" style={{ margin: 0 }}>{s.hard}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
