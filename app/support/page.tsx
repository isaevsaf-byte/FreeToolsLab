"use client";

import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { SITE, isSet } from "@/lib/config";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/** /support — the only page with support links (plus footer + tool credit blocks). */
export default function SupportPage() {
  const lang = useLabStore((s) => s.lang);
  const t = dictionary[lang].support;
  const copy = lang === "ru" ? SITE.support.copy_ru : SITE.support.copy_en;
  const platforms = [
    { url: SITE.support.kofi, label: t.kofi },
    { url: SITE.support.github_sponsors, label: t.github },
    { url: SITE.support.buymeacoffee, label: t.bmc },
  ].filter((p) => isSet(p.url));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg text-ink pt-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl mx-auto space-y-10">
            <div>
              <h1 className="font-mono text-3xl sm:text-4xl text-ink mb-4">{t.title}</h1>
              <p className="text-muted text-lg leading-relaxed">{copy}</p>
            </div>

            <div className="space-y-3">
              {platforms.length ? (
                platforms.map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-rule rounded-token hover:border-link hover:bg-panel transition-colors font-mono text-sm"
                  >
                    {p.label}
                  </a>
                ))
              ) : (
                <p className="font-mono text-sm text-muted">{t.not_set}</p>
              )}
            </div>

            <div className="p-5 border border-rule rounded-token bg-panel">
              <h2 className="font-mono text-base text-ink mb-2">{t.byok_title}</h2>
              <p className="text-sm text-muted leading-relaxed">{t.byok_text}</p>
            </div>

            <div>
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted mb-3">{t.covers_title}</h2>
              <ul className="flex flex-wrap gap-2 mb-4">
                {SITE.support.covers.map((c) => (
                  <li key={c} className="font-mono text-xs px-2 py-1 border border-rule-2 rounded-full text-muted">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="font-mono text-sm text-ink tabular">
                {t.shipped.replace("{n}", String(SITE.support.tools_shipped_this_month))}
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
