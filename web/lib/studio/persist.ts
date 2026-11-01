"use client";

import { useEffect, useRef } from "react";

// Drawings are saved to studio/<key>.json in the repo (via the file API) and mirrored in localStorage.

export async function loadDrawing<T>(key: string): Promise<T | null> {
  try {
    const r = await fetch(`/api/file?path=${encodeURIComponent(`studio/${key}.json`)}`);
    if (r.ok) {
      const d = await r.json();
      if (d.exists && d.content) return JSON.parse(d.content) as T;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(`studio:${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return null;
}

function send(key: string, content: string, beacon = false) {
  const body = JSON.stringify({ path: `studio/${key}.json`, content });
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/file", new Blob([body], { type: "application/json" }));
    return;
  }
  fetch("/api/file", { method: "PUT", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
}

/**
 * Saves `data` whenever it changes: instantly to localStorage, debounced to the repo file,
 * and flushed when the page is hidden/closed or the component unmounts (so nothing is lost).
 */
export function useAutosave(key: string, data: unknown, enabled: boolean) {
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const content = JSON.stringify(data, null, 2) + "\n";
    try { localStorage.setItem(`studio:${key}`, content); } catch {}
    pending.current = content;
    const t = setTimeout(() => { if (pending.current) { send(key, pending.current); pending.current = null; } }, 700);
    return () => clearTimeout(t);
  }, [key, data, enabled]);

  useEffect(() => {
    const flush = (beacon: boolean) => { if (pending.current) { send(key, pending.current, beacon); pending.current = null; } };
    const onHide = () => { if (document.visibilityState === "hidden") flush(true); };
    const onPageHide = () => flush(true);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onHide);
      flush(false); // client-side navigation away
    };
  }, [key]);
}
