"use client";

import Link from "next/link";
import { useCallback } from "react";
import { XP, levelBySlug } from "@/lib/data";
import { today, useProgress } from "@/lib/progress";
import FileEditor from "@/components/FileEditor";

export default function NoteView({ slug, topicId }: { slug: string; topicId: string }) {
  const level = levelBySlug(slug)!;
  const idx = level.topics.findIndex((t) => t.id === topicId);
  const topic = level.topics[idx];
  const prev = level.topics[idx - 1];
  const next = level.topics[idx + 1];
  const { p, update } = useProgress();
  const k = `${level.num}:${topic.id}`;

  const fill = useCallback(
    (tpl: string) =>
      tpl
        .replace("{{Concept name}}", topic.title)
        .replace("{{NN}}", level.num)
        .replace("{{YYYY-MM-DD}}", today())
        .replace("{{link}}", "AlgoMaster"),
    [topic.title, level.num],
  );
  const onSaved = useCallback(
    (c: string) => { if (c.trim()) update((pr) => ({ ...pr, topics: { ...pr.topics, [k]: true } })); },
    [update, k],
  );

  return (
    <div className="stack">
      <div className="row spread">
        <Link href={`/level/${level.slug}`} className="small">← Level {level.num} · {level.title}</Link>
        <div className="row small">
          {prev && <Link href={`/level/${level.slug}/note/${prev.id}`}>← {prev.title}</Link>}
          {next && <Link href={`/level/${level.slug}/note/${next.id}`}>{next.title} →</Link>}
        </div>
      </div>
      <div className="row spread">
        <h1 style={{ margin: 0 }}>{topic.title}</h1>
        {p.topics[k] ? <span className="pill good">✓ note done</span> : <span className="pill xp">+{XP.topic} XP on save</span>}
      </div>
      <div className="card tight small muted">
        <b>How to fill this:</b> read the lesson first, then close it and write every section from memory. Check the lesson afterwards and fix what you got wrong. Lines like <code>question? :: answer</code> become flashcards in the Obsidian Spaced Repetition plugin.
      </div>
      <FileEditor
        path={`sections/${level.slug}/notes/${topic.id}.md`}
        template="templates/concept.md"
        fill={fill}
        onSaved={onSaved}
      />
    </div>
  );
}
