"use client";

import { XP } from "@/lib/data";

export type Problem = { id: string; title: string; why: string; severity: "error" | "warn"; where: string[] };
type Props = {
  steps: { title: string; cleared: boolean }[];
  stepIdx: number;
  onStep: (i: number) => void;
  title: string;
  story: string;
  goals: { text: string; ok: boolean; msg?: string }[];
  problems: Problem[];
  checked: boolean;
  passed: boolean;
  onCheck: () => void;
  explain: string;
  hints: string[];
  hintCount: number;
  onHint: () => void;
  onSolution: () => void;
  onNext?: () => void;
  extra?: React.ReactNode;
};

/** Right-hand coaching panel: story → goals (live) → "Not like this" → check / hint / solution. */
export default function StepPanel(p: Props) {
  const errors = p.problems.filter((x) => x.severity === "error");
  const warns = p.problems.filter((x) => x.severity === "warn");
  const done = p.goals.filter((g) => g.ok).length;
  return (
    <aside className="studio-panel">
      {p.steps.length > 1 && (
        <div className="step-chips" role="tablist">
          {p.steps.map((s, i) => (
            <button key={i} role="tab" aria-selected={i === p.stepIdx} className={`${i === p.stepIdx ? "active" : ""} ${s.cleared ? "cleared" : ""}`} onClick={() => p.onStep(i)} title={s.title}>
              {s.cleared ? "✓" : i + 1}
            </button>
          ))}
        </div>
      )}

      <div>
        <span className="level-num">STEP {p.stepIdx + 1} OF {p.steps.length}</span>
        <h2 style={{ margin: "2px 0 6px" }}>{p.title}</h2>
        <div className="story"><b>What breaks:</b> {p.story}</div>
      </div>

      <div>
        <div className="row spread"><h3 style={{ margin: 0 }}>Your goals</h3><span className="muted small">{done}/{p.goals.length}</span></div>
        <ul className="goals">
          {p.goals.map((g, i) => (
            <li key={i} className={g.ok ? "ok" : ""}>
              <span className="tick">{g.ok ? "✓" : "○"}</span>
              <span>
                {g.text}
                {!g.ok && p.checked && g.msg && <span className="goal-msg">{g.msg}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(errors.length > 0 || warns.length > 0) && (
        <div className="stack" style={{ gap: 8 }}>
          {[...errors, ...warns].map((x) => (
            <div key={x.id} className={`nope ${x.severity}`}>
              <div className="nope-title">{x.severity === "error" ? "✋ Not like this:" : "⚠️ Careful:"} {x.title}</div>
              {x.where.length > 0 && <div className="nope-where">{x.where.join(" · ")}</div>}
              <div className="small">{x.why}</div>
            </div>
          ))}
        </div>
      )}

      {p.checked && p.passed ? (
        <div className="win">
          <div className="row spread"><b>🎉 Step cleared!</b><span className="pill xp">+{XP.studio} XP</span></div>
          <p className="small" style={{ margin: "8px 0" }}><b>Why this works:</b> {p.explain}</p>
          {p.onNext ? <button className="btn primary" onClick={p.onNext}>Next step →</button> : <p className="small" style={{ margin: 0 }}><b>Puzzle complete.</b> Explain this design out loud in 2 minutes, as you would in an interview.</p>}
        </div>
      ) : p.checked ? (
        <div className="fail small">
          {errors.length ? `Fix the ${errors.length} “Not like this” issue${errors.length > 1 ? "s" : ""} above, ` : ""}
          {p.goals.some((g) => !g.ok) ? "then finish the goals marked ○ (each one now says what's missing)." : ""}
        </div>
      ) : null}

      <div className="row">
        <button className="btn primary" onClick={p.onCheck}>✔ Check my design</button>
        <button className="btn" onClick={p.onHint} disabled={p.hintCount >= p.hints.length}>💡 Hint {p.hintCount}/{p.hints.length}</button>
        <button className="btn ghost" onClick={p.onSolution}>👀 Solution</button>
      </div>
      {p.hintCount > 0 && (
        <ol className="hints">
          {p.hints.slice(0, p.hintCount).map((h, i) => <li key={i}>{h}</li>)}
        </ol>
      )}
      {p.extra}
    </aside>
  );
}
