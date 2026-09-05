"use client";

import { useEffect } from "react";
import { useLabStore } from "@/store/useLabStore";
import { detectLang } from "@shared/i18n.js";
import { detectTheme } from "@shared/theme.js";

/** Reads ?lang= (then navigator.language) and ?theme= once after mount. No localStorage. */
export function PrefsSync() {
  const initPrefs = useLabStore((s) => s.initPrefs);
  useEffect(() => {
    initPrefs(detectLang() as "en" | "ru", detectTheme() as "light" | "dark");
  }, [initPrefs]);
  return null;
}
