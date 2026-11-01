import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "System Design Quest",
  description: "Learn system design and databases like a game: levels, flashcards, boss fights, labs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          <Nav />
          <main className="container">{children}</main>
        </ProgressProvider>
      </body>
    </html>
  );
}
