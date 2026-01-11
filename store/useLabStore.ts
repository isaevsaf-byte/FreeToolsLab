import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/lib/dictionary";

interface LabState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useLabStore = create<LabState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "lab-storage",
    }
  )
);