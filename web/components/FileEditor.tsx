"use client";

import { useEffect, useState } from "react";
import Markdown from "./Markdown";
import { useToast } from "./Toast";

type Props = {
  path: string;
  template?: string;          // repo path of a template used when the file doesn't exist
  fill?: (tpl: string) => string;
  onSaved?: (content: string) => void;
  rows?: number;
};

/** Edits a Markdown file inside the repo through /api/file. Falls back to localStorage. */
export default function FileEditor({ path, template, fill, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        let text: string = d.content;
        if (!d.exists && (template || fill)) {
          const tpl = template ? (await fetch(`/api/file?path=${encodeURIComponent(template)}`).then((x) => x.json())).content ?? "" : "";
          text = fill ? fill(tpl) : tpl;
        }
        if (!cancelled) { setContent(text); setSaved(d.exists ? text : ""); }
      } catch {
        if (!cancelled) {
          setOffline(true);
          try { const v = localStorage.getItem(`file:${path}`) ?? ""; setContent(v); setSaved(v); } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [path, template, fill]);

  const save = async () => {
    try {
      if (offline) throw new Error();
      const r = await fetch("/api/file", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, content }) });
      if (!r.ok) throw new Error();
      toast.show(`Saved to ${path}`);
    } catch {
      try { localStorage.setItem(`file:${path}`, content); } catch {}
      toast.show("Saved in this browser only");
    }
    setSaved(content);
    onSaved?.(content);
  };

  // Ctrl/Cmd+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const dirty = content !== saved;
  return (
    <div className="stack">
      <div className="row spread">
        <div className="tabs">
          <button className={tab === "write" ? "active" : ""} onClick={() => setTab("write")}>Write</button>
          <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>Preview</button>
        </div>
        <div className="row">
          <span className="muted small mono">{path}</span>
          <button className="btn primary sm" onClick={save} disabled={loading}>{dirty ? "Save (⌘S)" : "Saved"}</button>
        </div>
      </div>
      {offline && <div className="banner">The file API isn&apos;t reachable, so this is saved in your browser only. Run the app locally with <code>npm run dev</code> to write files into the repo.</div>}
      {loading ? <p className="muted">Loading…</p> : tab === "write" ? (
        <textarea className="editor" value={content} onChange={(e) => setContent(e.target.value)} spellCheck />
      ) : (
        <div className="card"><Markdown>{content || "_Nothing written yet._"}</Markdown></div>
      )}
      {toast.node}
    </div>
  );
}
