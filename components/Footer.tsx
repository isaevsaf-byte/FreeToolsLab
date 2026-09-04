"use client";

import Link from "next/link";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { SITE, isSet } from "@/lib/config";

/** Site footer — one of the three places a support link may live (CLAUDE.md). */
export function Footer() {
  const lang = useLabStore((s) => s.lang);
  const t = dictionary[lang];
  const credit = lang === "ru" ? SITE.credit_ru : SITE.credit_en;

  return (
    <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-rule">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-muted">
        <a
          href={SITE.author.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink transition-colors"
        >
          {credit}
        </a>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/support" className="hover:text-ink transition-colors">
            {t.footer.support}
          </Link>
          <Link href="/subscribe" className="hover:text-ink transition-colors">
            {t.footer.subscribe}
          </Link>
          {isSet(SITE.submit_tool) && (
            <a href={SITE.submit_tool} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
              {t.footer.submit}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
