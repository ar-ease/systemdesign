"use client";

import Link from "next/link";
import { LEVELS, LABS, STUDY_ORDER, WEEKS, XP, levelByNum } from "@/lib/data";
import { levelStats, nextQuest, stats, useProgress } from "@/lib/progress";
import Bar from "@/components/Bar";
import Heatmap from "@/components/Heatmap";
import LevelTile from "@/components/LevelTile";

export default function Dashboard() {
  const { p, loaded, mode, update } = useProgress();
  if (!loaded) return <p className="muted">Loading your save file…</p>;
  const s = stats(p);
  const quest = nextQuest(p);
  const againCount = Object.values(p.recall).filter((v) => v === "again").length;
  const weekNum = p.startedAt ? Math.min(12, Math.floor((Date.now() - new Date(p.startedAt).getTime()) / (7 * 864e5)) + 1) : 1;
  const weekLab = LABS.find((l) => l.week.split(/[^0-9]+/).includes(String(weekNum)) && !p.labs[l.id]);
  const order = STUDY_ORDER.map(levelByNum);

  return (
    <div className="stack">
      {mode === "browser" && <div className="banner">Progress is being saved in this browser only. Run the app locally (<code>cd web && npm run dev</code>) to save it to <code>progress.json</code> in the repo.</div>}

      <div className="row spread">
        <div>
          <h1 style={{ marginBottom: 2 }}>{p.startedAt ? `Week ${weekNum} of 12` : "Welcome, engineer"}</h1>
          <p className="muted" style={{ margin: 0 }}>Learn by levels: notes → flashcards → boss fight → lab. Then commit.</p>
        </div>
        <Link href="/review" className="btn">Review cards{againCount ? ` · ${againCount} to retry` : ""}</Link>
      </div>

      {/* stats */}
      <div className="grid g4">
        <div className="card tight">
          <div className="muted small">Rank</div>
          <div className="big">{s.rank.name}</div>
          <Bar pct={s.rankPct} kind="xp" />
          <div className="muted small" style={{ marginTop: 4 }}>{s.next ? `${s.xp} / ${s.next.min} XP to ${s.next.name}` : "Max rank"}</div>
        </div>
        <div className="card tight"><div className="muted small">Streak</div><div className="big">🔥 {s.streak}</div><div className="muted small">days in a row</div></div>
        <div className="card tight"><div className="muted small">Levels cleared</div><div className="big">{s.levelsCleared}<span className="muted" style={{ fontSize: "1rem" }}>/18</span></div><Bar pct={(s.levelsCleared / 18) * 100} kind="good" /></div>
        <div className="card tight"><div className="muted small">Labs · Systems</div><div className="big">{s.labsCleared}<span className="muted" style={{ fontSize: "1rem" }}>/10</span> · {s.systemsDone}<span className="muted" style={{ fontSize: "1rem" }}>/9</span></div><div className="muted small">hands-on · boss systems</div></div>
      </div>

      {/* today's quest */}
      <div className="grid g2">
        <div className="card stack">
          <div className="row spread"><h2 style={{ margin: 0 }}>⚔️ Today&apos;s quest</h2><span className="pill">~1.5 h</span></div>
          {quest ? (
            <ol style={{ margin: 0, paddingLeft: 20 }} className="stack">
              <li>
                <b>Warm up:</b> <Link href="/review">3 review cards</Link> <span className="muted small">(10 min)</span>
              </li>
              {quest.topic ? (
                <li>
                  <b>Learn:</b> {quest.topic.title} <span className="muted">in Level {quest.level.num} · {quest.level.title}</span>{" "}
                  <span className="muted small">(40 min)</span>
                </li>
              ) : (
                <li><b>Boss fight:</b> all topics done in <Link href={`/level/${quest.level.slug}#boss`}>Level {quest.level.num}</Link>. Time to beat it.</li>
              )}
              {quest.topic && (
                <li>
                  <b>Write:</b> <Link href={`/level/${quest.level.slug}/note/${quest.topic.id}`}>your note on {quest.topic.title}</Link> from memory <span className="muted small">(20 min · +{XP.topic} XP)</span>
                </li>
              )}
              <li>
                <b>Do:</b>{" "}
                {weekLab ? <Link href={`/labs/${weekLab.id}`}>Lab {weekLab.id} · {weekLab.title}</Link> : <Link href={`/level/${quest.level.slug}#cards`}>2 flashcards in Level {quest.level.num}</Link>}{" "}
                <span className="muted small">(20 min)</span>
              </li>
              <li><b>Commit:</b> <code>git add -A && git commit -m &quot;day N&quot; && git push</code></li>
            </ol>
          ) : <p>Everything cleared. Time for mock interviews! 🎉</p>}
          {quest && (
            <Link className="btn primary" href={quest.topic ? `/level/${quest.level.slug}/note/${quest.topic.id}` : `/level/${quest.level.slug}#boss`}>
              Start: {quest.topic ? quest.topic.title : `Boss of Level ${quest.level.num}`} →
            </Link>
          )}
        </div>

        <div className="card stack">
          <div className="row spread"><h2 style={{ margin: 0 }}>Activity</h2><span className="muted small">last 12 weeks</span></div>
          <Heatmap />
          <h3 style={{ marginTop: 16 }}>12-week quest line</h3>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {WEEKS.map((w, i) => {
              const k = String(i + 1);
              return (
                <label key={k} className="check">
                  <input type="checkbox" checked={!!p.weeks[k]} onChange={(e) => update((prev) => ({ ...prev, weeks: { ...prev.weeks, [k]: e.target.checked } }))} />
                  <span className={`grow small ${p.weeks[k] ? "done-text" : ""}`}><b>Week {k}:</b> {w}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* map */}
      <div className="section">
        <div className="row spread"><h2>Level map</h2><Link href="/levels" className="small">All levels →</Link></div>
        <p className="muted small">In study order. Databases get the biggest block because interviews push hardest there.</p>
        <div className="grid g3">
          {order.slice(0, 9).map((l) => <LevelTile key={l.num} level={l} isNext={quest?.level.num === l.num} />)}
        </div>
      </div>

      <p className="muted small">
        {LEVELS.reduce((a, l) => a + levelStats(p, l).topicsDone, 0)} notes written ·{" "}
        {Object.values(p.recall).filter((v) => v === "known").length} cards known · started {p.startedAt ?? "today, once you tick something"}
      </p>
    </div>
  );
}
