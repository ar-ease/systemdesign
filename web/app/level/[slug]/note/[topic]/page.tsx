import { notFound } from "next/navigation";
import { LEVELS, levelBySlug } from "@/lib/data";
import NoteView from "./NoteView";

export function generateStaticParams() {
  return LEVELS.flatMap((l) => l.topics.map((t) => ({ slug: l.slug, topic: t.id })));
}

export default async function Page({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const level = levelBySlug(slug);
  if (!level || !level.topics.some((t) => t.id === topic)) notFound();
  return <NoteView slug={slug} topicId={topic} />;
}
