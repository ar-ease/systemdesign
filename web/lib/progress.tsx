"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LEVELS, LABS, SYSTEMS, RANKS, XP, STUDY_ORDER, type Level, levelByNum } from "./data";

export type RecallState = "known" | "again";
export type Progress = {
  version: 1;
  startedAt: string | null;
  topics: Record<string, boolean>; // "01:scalability"
  recall: Record<string, RecallState>; // "01:0"
  boss: Record<string, number>; // level num -> score 1-10
  labs: Record<string, boolean>;
  systems: Record<string, number>; // slug -> score 1-10
  weeks: Record<string, boolean>;
  activity: Record<string, number>; // "YYYY-MM-DD" -> actions that day
  studio: Record<string, boolean>; // "sys:grow-app:0" / "db:udemy:1" -> step cleared
};

export const EMPTY: Progress = {
  version: 1, startedAt: null, topics: {}, recall: {}, boss: {}, labs: {}, systems: {}, weeks: {}, activity: {}, studio: {},
};

const LS_KEY = "sd-quest-progress";
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---------- derived stats ----------
export const PASS = 7;

export function levelStats(p: Progress, l: Level) {
  const topicsDone = l.topics.filter((t) => p.topics[`${l.num}:${t.id}`]).length;
  const recallKnown = l.questions.filter((_, i) => p.recall[`${l.num}:${i}`] === "known").length;
  const bossScore = p.boss[l.num] ?? 0;
  const bossPassed = bossScore >= PASS;
  const total = l.topics.length + l.questions.length + 1;
  const done = topicsDone + recallKnown + (bossPassed ? 1 : 0);
  const pct = Math.round((done / total) * 100);
  const cleared = bossPassed && topicsDone === l.topics.length;
  const started = done > 0 || bossScore > 0;
  return { topicsDone, recallKnown, bossScore, bossPassed, pct, cleared, started };
}

export function stats(p: Progress) {
  let xp = 0;
  xp += Object.values(p.topics).filter(Boolean).length * XP.topic;
  xp += Object.values(p.recall).filter((v) => v === "known").length * XP.recall;
  xp += Object.values(p.boss).filter((s) => s >= PASS).length * XP.boss;
  xp += Object.values(p.labs).filter(Boolean).length * XP.lab;
  xp += Object.values(p.systems).filter((s) => s >= PASS).length * XP.system;
  xp += Object.values(p.studio ?? {}).filter(Boolean).length * XP.studio;

  const rankIdx = RANKS.reduce((acc, r, i) => (xp >= r.min ? i : acc), 0);
  const rank = RANKS[rankIdx];
  const next = RANKS[rankIdx + 1];
  const rankPct = next ? Math.round(((xp - rank.min) / (next.min - rank.min)) * 100) : 100;

  // streak: consecutive active days ending today (or yesterday if not yet active today)
  let streak = 0;
  const d = new Date();
  const key = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (!p.activity[key(d)]) d.setDate(d.getDate() - 1);
  while (p.activity[key(d)]) { streak++; d.setDate(d.getDate() - 1); }

  const levelsCleared = LEVELS.filter((l) => levelStats(p, l).cleared).length;
  const labsCleared = LABS.filter((l) => p.labs[l.id]).length;
  const systemsDone = SYSTEMS.filter((s) => (p.systems[s.slug] ?? 0) >= PASS).length;

  return { xp, rank, next, rankPct, streak, levelsCleared, labsCleared, systemsDone };
}

/** The level and topic to work on next, following the 12-week study order. */
export function nextQuest(p: Progress) {
  for (const n of STUDY_ORDER) {
    const l = levelByNum(n);
    const s = levelStats(p, l);
    if (s.cleared) continue;
    const topic = l.topics.find((t) => !p.topics[`${l.num}:${t.id}`]);
    return { level: l, topic, needsBoss: !topic && !s.bossPassed };
  }
  return null;
}

// ---------- context ----------
type Ctx = {
  p: Progress;
  loaded: boolean;
  mode: "file" | "browser";
  update: (fn: (p: Progress) => Progress, countsAsActivity?: boolean) => void;
};
const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [p, setP] = useState<Progress>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"file" | "browser">("file");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Progress) => setP({ ...EMPTY, ...data }))
      .catch(() => {
        setMode("browser");
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) setP({ ...EMPTY, ...JSON.parse(raw) });
        } catch {}
      })
      .finally(() => setLoaded(true));
  }, []);

  const pending = useRef<Progress | null>(null);

  const persist = useCallback((next: Progress) => {
    pending.current = next;
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current = null;
      fetch("/api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) })
        .then((r) => { if (!r.ok) setMode("browser"); })
        .catch(() => setMode("browser"));
    }, 300);
  }, []);

  // Don't lose a debounced save when the tab is closed or reloaded.
  useEffect(() => {
    const flush = () => {
      if (!pending.current) return;
      const blob = new Blob([JSON.stringify(pending.current)], { type: "application/json" });
      navigator.sendBeacon?.("/api/progress", blob);
      pending.current = null;
      if (timer.current) clearTimeout(timer.current);
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onHide); };
  }, []);

  const update = useCallback<Ctx["update"]>((fn, countsAsActivity = true) => {
    setP((prev) => {
      let next = fn(prev);
      if (countsAsActivity) {
        const d = today();
        next = { ...next, startedAt: next.startedAt ?? d, activity: { ...next.activity, [d]: (next.activity[d] ?? 0) + 1 } };
      }
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(() => ({ p, loaded, mode, update }), [p, loaded, mode, update]);
  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress() {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error("useProgress outside provider");
  return c;
}
