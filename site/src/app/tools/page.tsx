"use client";

import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { SITE, LAB_CONFIG, isSet } from "@/lib/config";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToolCard } from "@/components/ToolCard";
import registry from "@tools/registry.json";

/** Modules page — generated from tools/registry.json. Do not hand-edit tool lists. */
export default function ToolsPage() {
  const lang = useLabStore((s) => s.lang);
  const t = dictionary[lang].modules;
  const live = registry.tools.filter((x) => x.status === "live");
  const coming = [...registry.tools.filter((x) => x.status === "next"), ...registry.tools.filter((x) => x.status === "planned")];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg text-ink pt-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-mono text-3xl sm:text-4xl text-ink mb-4">{t.title}</h1>
            <p className="text-muted max-w-2xl mb-12">{t.sub}</p>

            <h2 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">{t.live}</h2>
            {live.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                {live.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} lang={lang} />
                ))}
              </div>
            ) : (
              <p className="text-muted mb-16">{t.empty}</p>
            )}

            {coming.length > 0 && (
              <>
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">{t.coming}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                  {coming.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} lang={lang} />
                  ))}
                </div>
              </>
            )}

            <p className="font-mono text-sm text-muted">
              {isSet(SITE.submit_tool) && (
                <a href={SITE.submit_tool} target="_blank" rel="noopener noreferrer" className="text-link underline underline-offset-2">
                  {t.submit}
                </a>
              )}
              {isSet(SITE.submit_tool) && " · "}
              <a href={LAB_CONFIG.links.submitEmail} className="text-link underline underline-offset-2">
                {t.submit_email}
              </a>
            </p>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
