"use client";

import Link from "next/link";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToolCard } from "@/components/ToolCard";
import registry from "@tools/registry.json";
import { SITE } from "@/lib/config";
import { prefsQuery } from "@shared/theme.js";

export default function HomePage() {
  const { lang, theme } = useLabStore();
  const t = dictionary[lang];
  const live = registry.tools.filter((tool) => tool.status === "live");
  // "next" (this week, already built) before "planned"
  const coming = [
    ...registry.tools.filter((tool) => tool.status === "next"),
    ...registry.tools.filter((tool) => tool.status === "planned"),
  ];
  // Landing shows live tools; until the first one ships, it shows what is coming next.
  const shown = live.length ? live : coming;
  const heading = live.length ? t.modules.live : t.modules.coming;
  const featured = live[0] ?? coming[0];
  const featuredName = featured ? (lang === "ru" ? featured.name_ru : featured.name_en) : "";
  const featuredHook = featured ? (lang === "ru" ? featured.hook_ru : featured.hook_en) : "";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-bg text-ink pt-16">
        {/* Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-go bg-go-soft rounded-full">
              <div className="h-2 w-2 bg-go rounded-full animate-pulse" aria-hidden="true" />
              <span className="font-mono text-xs text-go">{t.hero.badge}</span>
            </div>

            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-light text-ink mb-6 leading-tight">
              {t.hero.title}
            </h1>

            <p className="text-muted text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">{t.hero.sub}</p>

            {featured ? (
              <div className="flex flex-col items-center gap-3">
                <a
                  href={`${featured.url}${prefsQuery(lang, theme)}`}
                  className="inline-block font-mono text-sm px-6 py-3 border border-go text-go bg-go-soft hover:border-link transition-colors rounded-token"
                >
                  {t.hero.try.replace("{name}", featuredName)}
                </a>
                {featuredHook && <p className="font-mono text-sm text-muted tabular">{featuredHook}</p>}
                <Link href="/tools" className="font-mono text-xs text-muted underline underline-offset-2 hover:text-ink">
                  {t.hero.cta}
                </Link>
              </div>
            ) : (
              <Link
                href="/tools"
                className="inline-block font-mono text-sm px-6 py-3 border border-rule-2 hover:border-link hover:bg-panel transition-colors rounded-token"
              >
                {t.hero.cta}
              </Link>
            )}

            {/* Trust strip: the claims the check script verifies on every build */}
            <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
              <li>{t.trust.requests}</li>
              <li>{t.trust.cookies}</li>
              <li>{t.trust.account}</li>
              <li>
                <a
                  href={`${SITE.repo}/blob/main/scripts/check.mjs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  {t.trust.how}
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* Mission */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-rule">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-mono text-2xl text-ink mb-6">{t.mission.title}</h2>
            <p className="text-muted leading-relaxed text-lg">{t.mission.text}</p>
          </div>
        </section>

        {/* Live tools — generated from tools/registry.json */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-rule">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">{heading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map((tool) => (
                <ToolCard key={tool.id} tool={tool} lang={lang} />
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
