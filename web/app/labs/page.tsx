"use client";

import Link from "next/link";
import { LABS, XP } from "@/lib/data";
import { useProgress } from "@/lib/progress";

export default function Labs() {
  const { p } = useProgress();
  return (
    <div className="stack">
      <h1>Labs</h1>
      <p className="muted">Hands-on Docker labs. The loop: <b>build it → load it → break it → write down the numbers</b>. +{XP.lab} XP each, counted when <code>RESULTS.md</code> has real numbers.</p>
      <div className="grid g3">
        {LABS.map((l) => (
          <Link key={l.id} href={`/labs/${l.id}`} className={`card tight level-tile ${p.labs[l.id] ? "cleared" : ""}`}>
            <div className="row spread">
              <span className="level-num">LAB {l.id} · WEEK {l.week}</span>
              {p.labs[l.id] ? <span className="pill good">✓ cleared</span> : l.ready ? <span className="pill accent">ready</span> : <span className="pill">to build</span>}
            </div>
            <h3 style={{ margin: "8px 0 4px" }}>{l.title}</h3>
            <p className="small" style={{ margin: "0 0 6px" }}>{l.build}</p>
            <p className="muted small" style={{ margin: 0 }}>“{l.question}”</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
