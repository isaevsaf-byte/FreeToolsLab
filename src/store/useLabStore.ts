import { create } from "zustand";
import type { Language } from "@/lib/dictionary";
import { applyLangToUrl } from "@shared/i18n.js";
import { applyTheme, applyThemeToUrl } from "@shared/theme.js";

export type Theme = "light" | "dark";

interface LabState {
  lang: Language;
  theme: Theme;
  /** Set from URL detection after mount (no URL write). */
  initPrefs: (lang: Language, theme: Theme) => void;
  /** User toggles: state lives in the URL (?lang=, ?theme=), never in localStorage. */
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

const setDocLang = (lang: Language) => {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
};

export const useLabStore = create<LabState>()((set) => ({
  lang: "en",
  theme: "light",
  initPrefs: (lang, theme) => {
    setDocLang(lang);
    applyTheme(theme);
    set({ lang, theme });
  },
  setLang: (lang) => {
    applyLangToUrl(lang);
    setDocLang(lang);
    set({ lang });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    applyThemeToUrl(theme);
    set({ theme });
  },
}));
