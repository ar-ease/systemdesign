"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@/lib/progress";
import { XP } from "@/lib/data";

export type Card = { key: string; q: string; a: string; tag?: string };

/** Recall game: think → reveal → grade yourself. "Got it" = +XP, "Again" = comes back first next time. */
export default function Flashcards({ cards, title = "Recall round" }: { cards: Card[]; title?: string }) {
  const { p, update } = useProgress();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const card = cards[i];

  useEffect(() => { setI(0); setShown(false); }, [cards.length]);

  const grade = (v: "known" | "again") => {
    update((prev) => ({ ...prev, recall: { ...prev.recall, [card.key]: v } }));
    setShown(false);
    setI((x) => (x + 1) % cards.length);
  };

  const known = useMemo(() => cards.filter((c) => p.recall[c.key] === "known").length, [cards, p.recall]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && ["TEXTAREA", "INPUT", "SELECT"].includes(el.tagName)) return;
      if (e.key === " ") { e.preventDefault(); setShown(true); }
      if (shown && e.key === "1") grade("again");
      if (shown && e.key === "2") grade("known");
      if (e.key === "ArrowRight") { setShown(false); setI((x) => (x + 1) % cards.length); }
      if (e.key === "ArrowLeft") { setShown(false); setI((x) => (x - 1 + cards.length) % cards.length); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!cards.length) return <div className="card muted">No cards here yet.</div>;

  return (
    <div className="card stack">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="pill good">{known}/{cards.length} known · +{XP.recall} XP each</span>
      </div>
      <div className="dots" aria-label="cards">
        {cards.map((c, j) => (
          <button
            key={c.key}
            className={`dot ${p.recall[c.key] ?? ""} ${j === i ? "current" : ""}`}
            title={c.q}
            onClick={() => { setI(j); setShown(false); }}
          />
        ))}
      </div>
      <div className="flash">
        <div>
          <div className="row spread">
            <span className="muted small">Card {i + 1} of {cards.length}{card.tag ? ` · ${card.tag}` : ""}</span>
            {p.recall[card.key] && <span className={`pill ${p.recall[card.key] === "known" ? "good" : "warn"}`}>{p.recall[card.key] === "known" ? "known" : "again"}</span>}
          </div>
          <p className="q" style={{ marginTop: 8 }}>{card.q}</p>
          {shown ? <div className="a">{card.a}</div> : <p className="muted small">Say your answer out loud first (aim for under 2 minutes), then reveal.</p>}
        </div>
        <div className="row">
          {!shown ? (
            <button className="btn primary" onClick={() => setShown(true)}>Reveal answer <span className="muted small">(space)</span></button>
          ) : (
            <>
              <button className="btn" onClick={() => grade("again")}>✗ Again <span className="muted small">(1)</span></button>
              <button className="btn good" onClick={() => grade("known")}>✓ Got it <span className="small">(2)</span></button>
            </>
          )}
          <button className="btn ghost" onClick={() => { setShown(false); setI((x) => (x + 1) % cards.length); }}>Skip →</button>
        </div>
      </div>
    </div>
  );
}
