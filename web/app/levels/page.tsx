"use client";

import { LEVELS, type Phase, STUDY_ORDER, levelByNum } from "@/lib/data";
import { nextQuest, useProgress } from "@/lib/progress";
import LevelTile from "@/components/LevelTile";

const PHASES: { phase: Phase; blurb: string }[] = [
  { phase: "Foundations", blurb: "Weeks 1–3 · how one app grows" },
  { phase: "Databases", blurb: "Weeks 4–7 · the part interviews push hardest" },
  { phase: "Distributed", blurb: "Weeks 8–10 · queues, consensus, transactions" },
  { phase: "Beyond", blurb: "After week 12 · one level a week" },
];

export default function Levels() {
  const { p } = useProgress();
  const q = nextQuest(p);
  const ordered = STUDY_ORDER.map(levelByNum);
  return (
    <div className="stack">
      <h1>Levels</h1>
      <p className="muted">18 levels from the AlgoMaster syllabus. A level is <b>cleared</b> when every topic has a note and you beat its boss (score ≥ 7/10).</p>
      {PHASES.map(({ phase, blurb }) => (
        <div key={phase} className="section">
          <div className="row"><h2 style={{ margin: 0 }}>{phase}</h2><span className="muted small">{blurb}</span></div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            {ordered.filter((l) => l.phase === phase).map((l) => <LevelTile key={l.num} level={l} isNext={q?.level.num === l.num} />)}
          </div>
        </div>
      ))}
      <p className="muted small">{LEVELS.length} levels · {LEVELS.reduce((a, l) => a + l.topics.length, 0)} topics · {LEVELS.reduce((a, l) => a + l.questions.length, 0)} flashcards</p>
    </div>
  );
}
