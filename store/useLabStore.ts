import { create } from "zustand";
import type { Language } from "@/lib/dictionary";
import { applyLangToUrl } from "@/shared/i18n.js";

interface LabState {
  lang: Language;
  /** Set from detection (no URL write). */
  initLang: (lang: Language) => void;
  /** User toggle: state lives in the URL (?lang=), never in localStorage. */
  setLang: (lang: Language) => void;
}

const setDocLang = (lang: Language) => {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
};

export const useLabStore = create<LabState>()((set) => ({
  lang: "en",
  initLang: (lang) => {
    setDocLang(lang);
    set({ lang });
  },
  setLang: (lang) => {
    applyLangToUrl(lang);
    setDocLang(lang);
    set({ lang });
  },
}));
