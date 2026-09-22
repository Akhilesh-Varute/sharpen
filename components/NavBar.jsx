"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v4M16 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  },
  {
    href: "/habits",
    label: "Habits",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    href: "/learning",
    label: "Learning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 bg-paper/90 dark:bg-dpaper/90 backdrop-blur border-t border-line dark:border-dline"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-2xl mx-auto px-2 flex items-stretch justify-between h-16">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold transition ${
                active ? "text-ink dark:text-dink" : "text-ink-faint dark:text-dink-faint"
              }`}
            >
              <span className={`w-5 h-5 ${active ? "text-accent dark:text-daccent" : ""}`}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold text-ink-faint dark:text-dink-faint"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </nav>
  );
}
