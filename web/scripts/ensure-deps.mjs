// Runs before `npm run dev` / `npm run build`: if any dependency in package.json
// is missing from node_modules (e.g. after `git pull` added a new one), install it.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const missing = deps.filter((d) => !existsSync(join(root, "node_modules", d, "package.json")));

if (missing.length) {
  console.log(`\n📦 Missing packages: ${missing.join(", ")}\n   Running npm install…\n`);
  execSync("npm install --no-audit --no-fund", { cwd: root, stdio: "inherit" });
}
