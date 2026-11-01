import { NextResponse } from "next/server";
import { readRepoFile, writeRepoFile } from "@/lib/repo";

export const dynamic = "force-dynamic";
const FILE = "progress.json";

export async function GET() {
  const raw = await readRepoFile(FILE);
  return NextResponse.json(raw ? JSON.parse(raw) : {});
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (typeof body !== "object" || body === null || body.version !== 1) {
    return NextResponse.json({ error: "bad progress payload" }, { status: 400 });
  }
  try {
    await writeRepoFile(FILE, JSON.stringify(body, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// sendBeacon (used when the tab closes) can only POST.
export const POST = PUT;
