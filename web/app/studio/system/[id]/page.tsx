import { notFound } from "next/navigation";
import { PUZZLES } from "@/lib/studio/puzzles";
import SystemStudio from "./SystemStudio";

export function generateStaticParams() {
  return [...PUZZLES.map((p) => ({ id: p.id })), { id: "sandbox" }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "sandbox" && !PUZZLES.some((p) => p.id === id)) notFound();
  return <SystemStudio id={id} />;
}
