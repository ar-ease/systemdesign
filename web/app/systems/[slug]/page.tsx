import { notFound } from "next/navigation";
import { SYSTEMS } from "@/lib/data";
import SystemView from "./SystemView";

export function generateStaticParams() {
  return SYSTEMS.map((s) => ({ slug: s.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SYSTEMS.some((s) => s.slug === slug)) notFound();
  return <SystemView slug={slug} />;
}
