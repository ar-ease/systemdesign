"use client";

import { useCallback, useState } from "react";
import FileEditor from "./FileEditor";
import Timer from "./Timer";
import { PASS } from "@/lib/progress";

type Props = {
  title: string;
  prompt: string;
  path: string;
  template?: string;
  fill?: (t: string) => string;
  score: number;
  onScore: (n: number) => void;
  xp: number;
  graderIntro: string;
  minutes?: number;
};

export default function BossFight({ title, prompt, path, template, fill, score, onScore, xp, graderIntro, minutes = 45 }: Props) {
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const onSaved = useCallback((c: string) => setContent(c), []);

  const copy = async () => {
    let body = content;
    if (!body) {
      try { body = (await fetch(`/api/file?path=${encodeURIComponent(path)}`).then((r) => r.json())).content ?? ""; } catch {}
    }
    const text = `${graderIntro}\n\nAct as a senior interviewer at a product company. Grade my design 1–10, list what's missing or wrong, and ask me 3 follow-up questions an interviewer would push on.\n\n---\n${body || "(paste your design here)"}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="card boss stack">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>👹 {title}</h2>
        <span className="pill xp">+{xp} XP at {PASS}/10</span>
      </div>
      <div className="md"><blockquote style={{ margin: 0 }}>{prompt}</blockquote></div>
      <div className="row spread">
        <Timer minutes={minutes} />
        <div className="row">
          <button className="btn sm" onClick={copy}>{copied ? "Copied ✓" : "Copy grading prompt for Claude"}</button>
          <label className="row small">
            Score
            <select value={score || ""} onChange={(e) => onScore(Number(e.target.value))}>
              <option value="">–</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}/10</option>)}
            </select>
          </label>
          {score >= PASS && <span className="pill good">👑 defeated</span>}
        </div>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        Draw it on <a href="https://excalidraw.com" target="_blank" rel="noreferrer">Excalidraw</a>, write your answer below and save. Then copy the grading prompt, paste it to Claude, and record the score it gives you.
      </p>
      <FileEditor path={path} template={template} fill={fill} onSaved={onSaved} />
    </div>
  );
}
