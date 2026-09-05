import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { tokens } from "./tokens";

/** End card: "Safar Isaev · FreeToolsLab" (or a tool URL + author) — fades in over the last second. */
export const Credit: React.FC<{ line?: string; sub?: string }> = ({ line = "Safar Isaev · FreeToolsLab", sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: tokens.bg,
        color: tokens.ink,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: tokens.fontMono,
        padding: 80,
        gap: 28,
        opacity,
      }}
    >
      <div style={{ fontSize: line.length > 30 ? 36 : 44, textAlign: "center", overflowWrap: "anywhere" }}>{line}</div>
      {sub && <div style={{ fontSize: 30, color: tokens.muted, textAlign: "center" }}>{sub}</div>}
    </AbsoluteFill>
  );
};
