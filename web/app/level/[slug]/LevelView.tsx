"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { LABS, READING, XP, levelBySlug } from "@/lib/data";
import { levelStats, useProgress } from "@/lib/progress";
import Bar from "@/components/Bar";
import BossFight from "@/components/BossFight";
import Flashcards from "@/components/Flashcards";

export default function LevelView({ slug }: { slug: string }) {
  const level = levelBySlug(slug)!;
  const { p, update } = useProgress();
  const s = levelStats(p, level);
  const cards = useMemo(() => level.questions.map((q, i) => ({ key: `${level.num}:${i}`, ...q })), [level]);
  const fillBoss = useCallback(
    () => `# Boss fight · Level ${level.num} ${level.title}\n\n> ${level.boss}\n\n## Requirements\n\n## Design\n\n## Trade-offs\n\n## What I'd improve\n`,
    [level],
  );
  const labs = LABS.filter((l) => level.labs.includes(l.id));

  return (
    <div className="stack">
      <div>
        <Link href="/levels" className="small">← All levels</Link>
        <div className="row spread" style={{ marginTop: 8 }}>
          <div>
            <span className="level-num">LEVEL {level.num} · {level.phase.toUpperCase()} · WEEK {level.week}</span>
            <h1 style={{ margin: "4px 0" }}>{level.title}</h1>
            <p className="muted" style={{ margin: 0 }}>{level.covers}</p>
          </div>
          {s.cleared ? <span className="pill good">✓ Level cleared</span> : <span className="pill">{s.pct}% complete</span>}
        </div>
        <div style={{ marginTop: 12 }}><Bar pct={s.pct} kind={s.cleared ? "good" : undefined} /></div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="row spread">
            <h2 style={{ margin: 0 }}>📖 Topics</h2>
            <span className="pill xp">+{XP.topic} XP per note</span>
          </div>
          <p className="muted small">Read the lesson, then write the note <b>from memory</b>. Saving a note ticks the topic.</p>
          {level.topics.map((t) => {
            const k = `${level.num}:${t.id}`;
            const done = !!p.topics[k];
            return (
              <div key={t.id} className="check">
                <input type="checkbox" checked={done} aria-label={`${t.title} done`}
                  onChange={(e) => update((prev) => ({ ...prev, topics: { ...prev.topics, [k]: e.target.checked } }))} />
                <span className={`grow ${done ? "done-text" : ""}`}>{t.title}</span>
                <Link className="btn sm" href={`/level/${level.slug}/note/${t.id}`}>{done ? "Open note" : "Write note"}</Link>
              </div>
            );
          })}
        </div>

        <div className="stack">
          <div className="card">
            <h2>Read</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {READING.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>)}
            </ul>
            <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>AlgoMaster: open section {Number(level.num)} in its sidebar. Use one main source per topic.</p>
          </div>
          {labs.length > 0 && (
            <div className="card">
              <h2>🧪 Labs for this level</h2>
              {labs.map((l) => (
                <div key={l.id} className="check">
                  <span className="grow"><Link href={`/labs/${l.id}`}>Lab {l.id} · {l.title}</Link><br /><span className="muted small">{l.question}</span></span>
                  {p.labs[l.id] ? <span className="pill good">cleared</span> : <span className="pill">{l.ready ? "ready" : "todo"}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <h2>Ask Claude</h2>
            <p className="small muted" style={{ marginBottom: 6 }}>Copy into a chat when a topic doesn&apos;t click:</p>
            <p className="small"><code>Teach me {level.topics[0].title} as a story of one app growing. Problem first, then the fix, then a trade-offs table, then 5 quiz questions.</code></p>
          </div>
        </div>
      </div>

      <div id="cards"><Flashcards cards={cards} /></div>

      <div id="boss">
        <BossFight
          title={`Boss · Level ${level.num}`}
          prompt={level.boss}
          path={`sections/${level.slug}/boss-fight.md`}
          fill={fillBoss}
          score={p.boss[level.num] ?? 0}
          onScore={(n) => update((prev) => ({ ...prev, boss: { ...prev.boss, [level.num]: n } }))}
          xp={XP.boss}
          graderIntro={`Boss fight for "${level.title}": ${level.boss}`}
        />
      </div>
    </div>
  );
}
