"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Rocket, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";

// Primary items stay visible at all times — the ones students open daily.
const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dsa", label: "DSA" },
  { href: "/applications", label: "Applications" },
  { href: "/progress", label: "Progress" },
];

// Secondary items are grouped under "More" to keep the top-level nav tight.
const secondaryLinks = [
  { href: "/interview-prep", label: "Interview Prep" },
  { href: "/mock-interview", label: "Mock Interview" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/resources", label: "Resources" },
  { href: "/resume-analyzer", label: "Resume Analyzer" },
  { href: "/settings", label: "Settings" },
];

const allLinks = [...primaryLinks, ...secondaryLinks];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const moreRef = useRef(null);

  const isSecondaryActive = secondaryLinks.some((l) => l.href === pathname);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-600 shrink-0">
            <Rocket size={22} />
            LessGo
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 transition-colors ${
                  isSecondaryActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                More
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1.5 origin-top-right transition-all duration-150 ${
                  moreOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {secondaryLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      pathname === l.href
                        ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button onClick={logout} className="btn-secondary">
                Log out
              </button>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-1">
            {allLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === l.href
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              {user ? (
                <button onClick={logout} className="btn-secondary w-full">
                  Log out
                </button>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary w-full" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
