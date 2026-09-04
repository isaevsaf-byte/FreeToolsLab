"use client";

import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { SITE, isSet } from "@/lib/config";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/** /subscribe — newsletter is opt-in on its own page. Never an email field inside a tool. */
export default function SubscribePage() {
  const lang = useLabStore((s) => s.lang);
  const t = dictionary[lang].subscribe;
  const url = SITE.subscribe.url;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg text-ink pt-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="font-mono text-3xl sm:text-4xl text-ink">{t.title}</h1>
            <p className="text-muted text-lg leading-relaxed">{t.text}</p>
            {isSet(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-mono text-sm px-6 py-3 border border-go text-go bg-go-soft rounded-token hover:border-link transition-colors"
              >
                {t.cta} · {SITE.subscribe.provider}
              </a>
            ) : (
              <p className="font-mono text-sm text-muted">{t.not_set}</p>
            )}
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
