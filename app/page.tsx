"use client";

import Link from "next/link";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { LAB_CONFIG } from "@/lib/config";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  const { lang } = useLabStore();
  const t = dictionary[lang];

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-slate-950 text-slate-100 pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-green-500/30 bg-green-500/10 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-mono text-xs text-green-400">
                {t.hero.badge}
              </span>
            </div>
            
            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-light text-slate-100 mb-6 leading-tight">
              {t.hero.title}
            </h1>
            
            <p className="text-slate-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {t.hero.sub}
            </p>
            
            <Link
              href="/tools"
              className="inline-block font-mono text-sm px-6 py-3 border border-slate-700 hover:border-slate-600 hover:bg-slate-900/50 transition-colors rounded"
            >
              {t.hero.cta}
            </Link>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-slate-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-mono text-2xl text-slate-200 mb-6">
              {t.mission.title}
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg">
              {t.mission.text}
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* TenderLens */}
              <Link
                href="/tools/tender-lens"
                className="group p-6 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 transition-all rounded-lg"
              >
                <h3 className="font-mono text-lg text-slate-200 mb-2 group-hover:text-green-400 transition-colors">
                  {t.tools.tender.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t.tools.tender.desc}
                </p>
              </Link>

              {/* DeepCure */}
              <Link
                href="/tools/deep-cure"
                className="group p-6 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 transition-all rounded-lg"
              >
                <h3 className="font-mono text-lg text-slate-200 mb-2 group-hover:text-green-400 transition-colors">
                  {t.tools.deep.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t.tools.deep.desc}
                </p>
              </Link>

              {/* Request Protocol */}
              <Link
                href="/tools/request-protocol"
                className="group p-6 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 transition-all rounded-lg"
              >
                <h3 className="font-mono text-lg text-slate-200 mb-2 group-hover:text-green-400 transition-colors">
                  {t.tools.request.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t.tools.request.desc}
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <p className="font-mono text-xs text-slate-500 text-center">
              Architected by{" "}
              <a
                href={LAB_CONFIG.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-green-400 transition-colors"
              >
                {LAB_CONFIG.author}
              </a>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
