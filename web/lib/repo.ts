import path from "node:path";
import { promises as fs } from "node:fs";

/** Repo root: the parent of web/ unless REPO_ROOT is set. */
export const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), "..");

// Only these repo paths can be written from the app.
const WRITABLE = [
  /^sections\/\d\d-[a-z0-9-]+\/notes\/[a-z0-9-]+\.md$/,
  /^sections\/\d\d-[a-z0-9-]+\/boss-fight\.md$/,
  /^systems\/[a-z0-9-]+\.md$/,
  /^labs\/\d\d-[a-z0-9-]+\/RESULTS\.md$/,
  /^studio\/(sys|db)-[a-z0-9-]+\.json$/,
];
const READABLE = [...WRITABLE, /^templates\/[a-z0-9-]+\.md$/, /^labs\/\d\d-[a-z0-9-]+\/[A-Za-z0-9_.-]+$/];

export const canWrite = (p: string) => WRITABLE.some((r) => r.test(p));
export const canRead = (p: string) => READABLE.some((r) => r.test(p));

export async function readRepoFile(rel: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(REPO_ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

export async function writeRepoFile(rel: string, content: string) {
  const full = path.join(REPO_ROOT, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}
