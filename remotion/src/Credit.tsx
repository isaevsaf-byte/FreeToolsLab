import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { tokens } from "./tokens";

/** End card: "Safar Isaev · FreeToolsLab" — fades in over the last second. */
export const Credit: React.FC<{ line?: string }> = ({ line = "Safar Isaev · FreeToolsLab" }) => {
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
        fontSize: 44,
        opacity,
      }}
    >
      {line}
    </AbsoluteFill>
  );
};
