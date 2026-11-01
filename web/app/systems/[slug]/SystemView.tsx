"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { SYSTEMS, XP, levelByNum } from "@/lib/data";
import { today, useProgress } from "@/lib/progress";
import BossFight from "@/components/BossFight";

export default function SystemView({ slug }: { slug: string }) {
  const sys = SYSTEMS.find((s) => s.slug === slug)!;
  const { p, update } = useProgress();
  const [copied, setCopied] = useState(false);
  const fill = useCallback(
    (tpl: string) =>
      tpl
        .replace("{{System}}", sys.title)
        .replace("{{YYYY-MM-DD}}", today())
        .replace("{{e.g. never sell a seat twice}}", sys.hard),
    [sys],
  );
  const mock = `Act as a senior interviewer at a product company. Ask me to design ${sys.title}. Don't give hints unless I'm stuck for a long time. Push hard on: ${sys.interviewer}. After 45 minutes, grade me 1–10 on requirements, estimates, API, data model, high-level design, deep dive and trade-offs.`;

  return (
    <div className="stack">
      <Link href="/systems" className="small">← All systems</Link>
      <div className="row spread">
        <div>
          <h1 style={{ margin: "4px 0" }}>{sys.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Hard problem: <b>{sys.hard}</b> · Builds on{" "}
            {sys.unlock.map((n, i) => (
              <span key={n}>{i > 0 && " + "}<Link href={`/level/${levelByNum(n).slug}`}>L{n} {levelByNum(n).title}</Link></span>
            ))}
          </p>
        </div>
        <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(mock); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}>
          {copied ? "Copied ✓" : "🎙 Copy mock-interview prompt"}
        </button>
      </div>
      <div className="card tight small muted">
        Two ways to play: (1) <b>Solo</b>: start the timer and fill in the template below, then get it graded. (2) <b>Live</b>: paste the mock-interview prompt into Claude and answer its questions; save your final design here.
      </div>
      <BossFight
        title={`Design ${sys.title}`}
        prompt={`Design ${sys.title}. The one hard problem: ${sys.hard}. Expect questions on ${sys.interviewer}.`}
        path={`systems/${sys.slug}.md`}
        template="templates/system-design.md"
        fill={fill}
        score={p.systems[sys.slug] ?? 0}
        onScore={(n) => update((pr) => ({ ...pr, systems: { ...pr.systems, [sys.slug]: n } }))}
        xp={XP.system}
        graderIntro={`System design interview: ${sys.title} (hard problem: ${sys.hard}).`}
      />
    </div>
  );
}
