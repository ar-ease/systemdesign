import { NextResponse } from "next/server";
import { canRead, canWrite, readRepoFile, writeRepoFile } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams.get("path") ?? "";
  if (!canRead(p)) return NextResponse.json({ error: "path not allowed" }, { status: 403 });
  const content = await readRepoFile(p);
  if (content === null) return NextResponse.json({ exists: false, content: "" });
  return NextResponse.json({ exists: true, content });
}

export async function PUT(req: Request) {
  const { path, content } = await req.json();
  if (typeof path !== "string" || typeof content !== "string" || !canWrite(path)) {
    return NextResponse.json({ error: "path not allowed" }, { status: 403 });
  }
  try {
    await writeRepoFile(path, content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
