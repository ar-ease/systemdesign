"use client";

import Link from "next/link";
import { LABS, XP } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import FileEditor from "@/components/FileEditor";
import Markdown from "@/components/Markdown";

export default function LabView({ id, readme }: { id: string; readme: string | null }) {
  const lab = LABS.find((l) => l.id === id)!;
  const { p, update } = useProgress();
  const cleared = !!p.labs[id];
  const scaffoldPrompt = `Scaffold Lab ${lab.id} (${lab.title}) in labs/${lab.slug}/ in the same style as labs/01-indexing: docker-compose.yml, scripts, README.md with missions and XP, and a RESULTS.md table. Build: ${lab.build}. Break/measure: ${lab.measure}. It should answer the interview question "${lab.question}".`;

  return (
    <div className="stack">
      <Link href="/labs" className="small">← All labs</Link>
      <div className="row spread">
        <div>
          <span className="level-num">LAB {lab.id} · WEEK {lab.week}</span>
          <h1 style={{ margin: "4px 0" }}>{lab.title}</h1>
          <p className="muted" style={{ margin: 0 }}>Interview question: “{lab.question}”</p>
        </div>
        <label className="row">
          <input type="checkbox" checked={cleared} onChange={(e) => update((pr) => ({ ...pr, labs: { ...pr.labs, [id]: e.target.checked } }))} style={{ width: 18, height: 18, accentColor: "var(--good)" }} />
          <b>Lab cleared</b> <span className="pill xp">+{XP.lab} XP</span>
        </label>
      </div>

      {readme ? (
        <>
          <div className="card"><Markdown>{readme.replace(/\]\(\.\.\/\.\.\/sections\/([a-z0-9-]+)\/?\)/g, "](/level/$1)")}</Markdown></div>
          <div className="card">
            <h2>Results</h2>
            <p className="muted small">Fill in your numbers here. Tick “Lab cleared” when every row has a value and you have written the interview answer.</p>
            <FileEditor path={`labs/${lab.slug}/RESULTS.md`} template="templates/lab-results.md" fill={undefined} />
          </div>
        </>
      ) : (
        <div className="card stack">
          <h2>Not built yet</h2>
          <p><b>Build:</b> {lab.build}<br /><b>Break / measure:</b> {lab.measure}</p>
          <p className="muted">When you reach this week, paste this to Claude and it will set the lab up for you:</p>
          <pre className="md" style={{ whiteSpace: "pre-wrap" }}><code>{scaffoldPrompt}</code></pre>
          <button className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => navigator.clipboard?.writeText(scaffoldPrompt)}>Copy prompt</button>
        </div>
      )}
    </div>
  );
}
