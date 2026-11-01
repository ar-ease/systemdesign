import Link from "next/link";
import { PUZZLES } from "@/lib/studio/puzzles";
import { DB_PUZZLES } from "@/lib/studio/dbPuzzles";
import { XP } from "@/lib/data";
import PuzzleCard from "@/components/studio/PuzzleCard";

export default function StudioHome() {
  return (
    <div className="stack">
      <div>
        <h1>Design Studio</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Learn by drawing. Every puzzle starts with <b>something breaking</b>. You fix it on the canvas, and the coach checks your design live.
          Wrong approaches get a <b>“✋ Not like this”</b> card explaining why. Stuck? Use the hints, or peek at the reference solution. +{XP.studio} XP per step.
        </p>
      </div>

      <div className="card tight row" style={{ gap: 18 }}>
        <span><b>1.</b> Read the problem</span><span className="muted">→</span>
        <span><b>2.</b> Draw it</span><span className="muted">→</span>
        <span><b>3.</b> Watch the live goals ✓</span><span className="muted">→</span>
        <span><b>4.</b> ✔ Check</span><span className="muted">→</span>
        <span><b>5.</b> Read “why it works”</span>
      </div>

      <div className="section">
        <div className="row spread"><h2 style={{ margin: 0 }}>🧩 System design</h2><Link href="/studio/system/sandbox" className="btn sm">Free canvas →</Link></div>
        <p className="muted small">Drag in boxes like load balancers, caches and queues, and connect them with arrows (arrow = “sends requests to”).</p>
        <div className="grid g3">
          {PUZZLES.map((p) => <PuzzleCard key={p.id} href={`/studio/system/${p.id}`} kind="sys" id={p.id} title={p.title} blurb={p.blurb} level={p.level} difficulty={p.difficulty} steps={p.steps.length} />)}
        </div>
      </div>

      <div className="section">
        <h2>🗄️ Database design</h2>
        <p className="muted small">Build tables, keys and indexes. The ER diagram and the real SQL update as you type, and the coach catches classic schema mistakes.</p>
        <div className="grid g3">
          {DB_PUZZLES.map((p) => <PuzzleCard key={p.id} href={`/studio/db/${p.id}`} kind="db" id={p.id} title={p.title} blurb={p.blurb} level={p.level} difficulty={p.difficulty} steps={p.steps.length} />)}
        </div>
      </div>

      <p className="muted small">Your drawings are saved to <code>studio/*.json</code> in the repo, so commit them like everything else. For free-hand sketching, <a href="https://excalidraw.com" target="_blank" rel="noreferrer">Excalidraw</a> is still great.</p>
    </div>
  );
}
