"use client";

import { useEffect, useState } from "react";

export default function Timer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="row">
      <span className={`timer ${left < 300 ? "low" : ""}`}>{mm}:{ss}</span>
      <button className="btn sm" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : left === minutes * 60 ? "Start timer" : "Resume"}</button>
      <button className="btn sm ghost" onClick={() => { setRunning(false); setLeft(minutes * 60); }}>Reset</button>
    </div>
  );
}
