import { notFound } from "next/navigation";
import { LABS } from "@/lib/data";
import { readRepoFile } from "@/lib/repo";
import LabView from "./LabView";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = LABS.find((l) => l.id === id);
  if (!lab) notFound();
  const readme = await readRepoFile(`labs/${lab.slug}/README.md`);
  return <LabView id={id} readme={readme} />;
}
