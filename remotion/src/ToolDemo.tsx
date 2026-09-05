import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { tokens } from "./tokens";

export type DemoEvent = {
  t: number;
  dur?: number;
  caption?: string;
  tap?: boolean;
  x?: number;
  y?: number;
  zoom?: { x: number; y: number; scale: number };
  image?: string;
};
export type ToolDemoProps = {
  video: string;
  events: DemoEvent[];
  footage: number;
  title: string;
  kicker: string;
  url: string;
  credit: string;
  titleSec: number;
  creditSec: number;
  /** optional music bed under public/, e.g. "music/cockpit.mp3"; faded in over 1 s and out over the credit */
  music?: string;
  musicVolume?: number;
  /** third line of the end card; defaults to the site promise, pass "" for non-tool videos */
  tagline?: string;
};

const sans = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/** Real screen recording of the tool + title, captions, tap ripples, one zoom at a time, PNG reveal, credit. */
export const ToolDemo: React.FC<ToolDemoProps> = ({ video, events, footage, title, kicker, url, credit, titleSec, creditSec, music, musicVolume = 0.35, tagline = "Free · local-first · no tracking" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const musicVol = (f: number) => musicVolume * interpolate(f, [0, fps, durationInFrames - Math.round(creditSec * fps), durationInFrames - 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = frame / fps;
  const ft = t - titleSec; // time inside the footage
  const titleFrames = Math.round(titleSec * fps);
  const footageFrames = Math.round(footage * fps);

  // zoom: ease in over 0.35 s, hold, ease out over 0.35 s
  let scale = 1;
  let ox = width / 2;
  let oy = height / 2;
  for (const e of events) {
    if (!e.zoom || !e.dur) continue;
    const s = e.t;
    const en = e.t + e.dur;
    if (ft < s - 0.35 || ft > en + 0.35) continue;
    const kIn = interpolate(ft, [s - 0.35, s], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const kOut = interpolate(ft, [en, en + 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    const k = Math.min(kIn, kOut);
    scale = 1 + (e.zoom.scale - 1) * k;
    ox = e.zoom.x;
    oy = e.zoom.y;
  }

  const caption = events.find((e) => e.caption && e.dur && ft >= e.t && ft <= e.t + e.dur);
  const capOpacity = caption
    ? Math.min(
        interpolate(ft, [caption.t, caption.t + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        interpolate(ft, [caption.t + caption.dur! - 0.2, caption.t + caption.dur!], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      )
    : 0;

  const image = events.find((e) => e.image && e.dur && ft >= e.t && ft <= e.t + e.dur + 0.4);
  const imgSpring = image ? spring({ frame: Math.round((ft - image.t) * fps), fps, config: { damping: 16, stiffness: 120 } }) : 0;
  const imgOut = image ? interpolate(ft, [image.t + image.dur!, image.t + image.dur! + 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: tokens.bg }}>
      {music && <Audio src={staticFile(music)} volume={musicVol} />}
      {/* title card */}
      <Sequence from={0} durationInFrames={titleFrames}>
        <TitleCard title={title} kicker={kicker} />
      </Sequence>

      {/* footage */}
      <Sequence from={titleFrames} durationInFrames={footageFrames}>
        <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${ox}px ${oy}px` }}>
          <OffthreadVideo src={staticFile(video)} />
        </AbsoluteFill>

        {events
          .filter((e) => e.tap)
          .map((e, i) => {
            const age = ft - e.t;
            if (age < 0 || age > 0.5) return null;
            const r = interpolate(age, [0, 0.5], [14, 84]);
            const op = interpolate(age, [0, 0.5], [0.85, 0]);
            return (
              <div
                key={i}
                style={{ position: "absolute", left: (e.x ?? 0) - r, top: (e.y ?? 0) - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `5px solid ${tokens.go}`, opacity: op, boxSizing: "border-box" }}
              />
            );
          })}

        {image && (
          <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 140, opacity: imgOut }}>
            <div style={{ transform: `translateY(${(1 - imgSpring) * 400}px) rotate(${(1 - imgSpring) * -3}deg)`, width: "88%", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", border: `1px solid ${tokens.rule2}` }}>
              <Img src={staticFile(image.image!)} style={{ display: "block", width: "100%" }} />
            </div>
          </AbsoluteFill>
        )}

        {caption && (
          <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56, opacity: capOpacity }}>
            <div style={{ fontFamily: tokens.fontMono, fontSize: 34, lineHeight: 1.25, color: tokens.ink, background: "rgba(10,13,20,0.86)", padding: "16px 26px", borderRadius: 12, maxWidth: "88%", textAlign: "center" }}>
              {caption.caption}
            </div>
          </AbsoluteFill>
        )}
      </Sequence>

      {/* credit */}
      <Sequence from={titleFrames + footageFrames} durationInFrames={Math.round(creditSec * fps)}>
        <CreditCard url={url} credit={credit} tagline={tagline} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{ title: string; kicker: string }> = ({ title, kicker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ backgroundColor: tokens.bg, color: tokens.ink, justifyContent: "center", padding: 96, gap: 28 }}>
      <div style={{ fontFamily: tokens.fontMono, fontSize: 28, color: tokens.go, letterSpacing: 2, textTransform: "uppercase", opacity: k }}>{kicker}</div>
      <div style={{ fontFamily: sans, fontSize: 92, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, transform: `translateY(${(1 - k) * 30}px)`, opacity: k }}>{title}</div>
    </AbsoluteFill>
  );
};

const CreditCard: React.FC<{ url: string; credit: string; tagline: string }> = ({ url, credit, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: tokens.bg, color: tokens.ink, justifyContent: "center", alignItems: "center", gap: 22, opacity, fontFamily: tokens.fontMono }}>
      <div style={{ fontSize: 40 }}>{url}</div>
      <div style={{ fontSize: 30, color: tokens.muted }}>{credit}</div>
      {tagline && <div style={{ fontSize: 26, color: tokens.muted, marginTop: 30 }}>{tagline}</div>}
    </AbsoluteFill>
  );
};
