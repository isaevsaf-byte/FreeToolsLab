"use client";

import { useEffect } from "react";
import { useLabStore } from "@/store/useLabStore";
import { detectLang } from "@/shared/i18n.js";

/** Reads ?lang= (then navigator.language) once after mount. No localStorage. */
export function LangSync() {
  const initLang = useLabStore((s) => s.initLang);
  useEffect(() => {
    initLang(detectLang() as "en" | "ru");
  }, [initLang]);
  return null;
}
