import { notFound } from "next/navigation";
import { DB_PUZZLES } from "@/lib/studio/dbPuzzles";
import DbStudio from "./DbStudio";

export function generateStaticParams() {
  return DB_PUZZLES.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!DB_PUZZLES.some((p) => p.id === id)) notFound();
  return <DbStudio id={id} />;
}
