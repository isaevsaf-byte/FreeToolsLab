// Mirror of shared/tokens.css for Remotion (CSS variables are not available in <Sequence> style props).
export const tokens = {
  bg: "#0A0D14",
  panel: "#10141D",
  panel2: "#151B26",
  ink: "#E6EAF0",
  muted: "#8B95A5",
  rule: "#1F2735",
  rule2: "#2A3446",
  go: "#22C55E",
  goSoft: "#0F2A1B",
  warn: "#F59E0B",
  warnSoft: "#2A1F0A",
  stop: "#EF4444",
  stopSoft: "#2A1212",
  link: "#7DD3FC",
  fontMono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

/** Video format from content/videos/_TEMPLATE.md */
export const VIDEO = { width: 1080, height: 1350, fps: 30 } as const;
