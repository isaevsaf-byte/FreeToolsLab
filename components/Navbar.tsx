"use client";

import { useState } from "react";
import { Globe, Linkedin, Mail, Github } from "lucide-react";
import { useLabStore } from "@/store/useLabStore";
import { dictionary } from "@/lib/dictionary";
import { LAB_CONFIG } from "@/lib/config";
import { SupportModal } from "./SupportModal";
import Link from "next/link";

export function Navbar() {
  const { lang, setLang } = useLabStore();
  const t = dictionary[lang];
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const toggleLang = () => {
    setLang(lang === "en" ? "ru" : "en");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="font-mono text-sm text-slate-300 hover:text-green-400 transition-colors">
              FreeToolsLab
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/tools"
                className="font-mono text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {t.nav.tools}
              </Link>
              
              <button
                onClick={() => setIsSupportOpen(true)}
                className="font-mono text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {t.nav.support}
              </button>

              <button
                onClick={toggleLang}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Toggle language"
              >
                <Globe className="h-4 w-4" />
              </button>

              <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-slate-800">
                {LAB_CONFIG.links.linkedin !== "https://www.linkedin.com/in/YOUR_PROFILE" && (
                  <a
                    href={LAB_CONFIG.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                <a
                  href={LAB_CONFIG.links.email}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
                {LAB_CONFIG.links.github !== "https://github.com/YOUR_GITHUB" && (
                  <a
                    href={LAB_CONFIG.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </>
  );
}
