"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stats, useProgress } from "@/lib/progress";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/levels", label: "Levels" },
  { href: "/review", label: "Review" },
  { href: "/labs", label: "Labs" },
  { href: "/systems", label: "Systems" },
];

export default function Nav() {
  const path = usePathname();
  const { p, loaded } = useProgress();
  const s = stats(p);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/levels" && path.startsWith("/level/")));
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">SD<span>Quest</span></Link>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>{l.label}</Link>
          ))}
        </nav>
        {loaded && (
          <div className="nav-right">
            <span className="pill hide-sm" title="Streak">🔥 {s.streak}d</span>
            <span className="pill xp" title="XP">★ {s.xp} XP</span>
            <span className="pill accent">{s.rank.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
