"use client";

import Link from "next/link";
import type { Level } from "@/lib/data";
import { levelStats, useProgress } from "@/lib/progress";
import Bar from "./Bar";

export default function LevelTile({ level, isNext }: { level: Level; isNext?: boolean }) {
  const { p } = useProgress();
  const s = levelStats(p, level);
  return (
    <Link href={`/level/${level.slug}`} className={`card tight level-tile ${s.cleared ? "cleared" : ""} ${isNext ? "next" : ""}`}>
      <div className="row spread">
        <span className="level-num">LEVEL {level.num}</span>
        {s.cleared ? <span className="pill good">✓ cleared</span> : isNext ? <span className="pill accent">▶ next</span> : <span className="pill">wk {level.week}</span>}
      </div>
      <h3 style={{ margin: "8px 0 4px" }}>{level.title}</h3>
      <p className="muted small" style={{ minHeight: 40 }}>{level.covers}</p>
      <Bar pct={s.pct} kind={s.cleared ? "good" : undefined} />
      <div className="row spread small muted" style={{ marginTop: 6 }}>
        <span>{s.topicsDone}/{level.topics.length} topics · {s.recallKnown}/{level.questions.length} cards</span>
        <span>{s.bossPassed ? "👑" : "boss"}</span>
      </div>
    </Link>
  );
}
