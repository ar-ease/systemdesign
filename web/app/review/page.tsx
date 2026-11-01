"use client";

import { useMemo, useState } from "react";
import { LEVELS } from "@/lib/data";
import { levelStats, useProgress } from "@/lib/progress";
import Flashcards, { type Card } from "@/components/Flashcards";

type Filter = "started" | "again" | "all";

export default function Review() {
  const { p, loaded } = useProgress();
  const [filter, setFilter] = useState<Filter>("started");
  const [seed, setSeed] = useState(0);

  // Build the deck once per filter/shuffle so grading a card doesn't reorder it under you.
  const cards = useMemo(() => {
    if (!loaded) return [];
    const all: (Card & { level: string })[] = LEVELS.flatMap((l) =>
      l.questions.map((q, i) => ({ key: `${l.num}:${i}`, q: q.q, a: q.a, tag: `L${l.num} ${l.title}`, level: l.num })),
    );
    const startedLevels = new Set(LEVELS.filter((l) => levelStats(p, l).started).map((l) => l.num));
    let deck = all;
    if (filter === "again") deck = all.filter((c) => p.recall[c.key] === "again");
    if (filter === "started") deck = all.filter((c) => startedLevels.has(c.level));
    const rank = (c: Card) => (p.recall[c.key] === "again" ? 0 : p.recall[c.key] ? 2 : 1);
    return deck
      .map((c) => ({ c, r: Math.random() }))
      .sort((a, b) => rank(a.c) - rank(b.c) || a.r - b.r)
      .map((x) => x.c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, seed, loaded]);

  return (
    <div className="stack">
      <h1>Review</h1>
      <p className="muted">Spaced recall across levels. Cards you marked <b>again</b> come first, then new ones, then ones you already know. Keys: <code>space</code> reveal · <code>1</code> again · <code>2</code> got it · <code>←/→</code> move.</p>
      <div className="row">
        <div className="tabs">
          {(["started", "again", "all"] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f === "started" ? "Levels I've started" : f === "again" ? "Only 'again'" : "Everything"}
            </button>
          ))}
        </div>
        <button className="btn sm" onClick={() => setSeed((x) => x + 1)}>Shuffle</button>
      </div>
      {cards.length ? (
        <Flashcards key={`${filter}-${seed}`} cards={cards} title={`${cards.length} cards`} />
      ) : (
        <div className="card muted">
          {filter === "started" ? "No levels started yet. Tick a topic or answer a card in a level first, or pick “Everything”." : "Nothing to review here."}
        </div>
      )}
    </div>
  );
}
