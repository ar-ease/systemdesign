import { notFound } from "next/navigation";
import { LEVELS, levelBySlug } from "@/lib/data";
import LevelView from "./LevelView";

export function generateStaticParams() {
  return LEVELS.map((l) => ({ slug: l.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!levelBySlug(slug)) notFound();
  return <LevelView slug={slug} />;
}
