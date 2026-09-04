"use client";

import Link from "next/link";
import { Globe, Linkedin, Mail } from "lucide-react";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { LAB_CONFIG, isSet } from "@/lib/config";

export function Navbar() {
  const { lang, setLang } = useLabStore();
  const t = dictionary[lang];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-rule bg-bg/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-mono text-sm text-ink hover:text-go transition-colors">
            FreeToolsLab
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/tools" className="font-mono text-xs text-muted hover:text-ink transition-colors">
              {t.nav.tools}
            </Link>

            <Link href="/support" className="font-mono text-xs text-muted hover:text-ink transition-colors">
              {t.nav.support}
            </Link>

            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="inline-flex items-center gap-1 p-2 font-mono text-xs text-muted hover:text-ink transition-colors"
              aria-label={`${lang === "en" ? "RU" : "EN"} · ${t.nav.lang}`}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              {lang === "en" ? "RU" : "EN"}
            </button>

            <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-rule">
              {isSet(LAB_CONFIG.links.linkedin) && (
                <a
                  href={LAB_CONFIG.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              <a href={LAB_CONFIG.links.email} className="text-muted hover:text-ink transition-colors" aria-label="Email">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
