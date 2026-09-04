"use client";

import type { Language } from "@/lib/dictionary";
import { dictionary } from "@/lib/dictionary";

export type RegistryTool = {
  id: string;
  name_en: string;
  name_ru: string;
  tagline_en: string;
  tagline_ru: string;
  category: string;
  status: string;
  added?: string;
  url: string;
  post_url?: string;
};

/** Plain <a>: tool pages are static HTML outside Next routing. */
export function ToolCard({ tool, lang }: { tool: RegistryTool; lang: Language }) {
  const t = dictionary[lang].modules.status as Record<string, string>;
  const live = tool.status === "live";
  const name = lang === "ru" ? tool.name_ru : tool.name_en;
  const tagline = lang === "ru" ? tool.tagline_ru : tool.tagline_en;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className={`font-mono text-lg text-ink ${live ? "group-hover:text-go" : ""} transition-colors`}>{name}</h3>
        <span
          className={`shrink-0 font-mono text-[11px] px-2 py-0.5 rounded-full border ${
            live ? "border-go text-go bg-go-soft" : "border-rule-2 text-muted"
          }`}
        >
          {t[tool.status] ?? tool.status}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{tagline}</p>
    </>
  );
  const cls = "group block p-6 border border-rule rounded-token transition-all";
  return live ? (
    <a href={tool.url} className={`${cls} hover:border-rule-2 hover:bg-panel`}>
      {body}
    </a>
  ) : (
    <div className={`${cls} border-dashed`}>{body}</div>
  );
}
