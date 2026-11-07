import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared Open Graph card renderer. */
export function ogImage(title: string, subtitle?: string, eyebrow = "OddsBridge") {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1f33", color: "white", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#10b981", display: "flex" }} />
          <div style={{ fontSize: 34, fontWeight: 800, display: "flex" }}>
            Odds<span style={{ color: "#34d399" }}>Bridge</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 26, color: "#34d399", textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 56 : 68, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 30, color: "rgba(255,255,255,0.75)" }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", display: "flex" }}>Odds comparison · Bonuses · Booking code converter · 18+ Gamble responsibly</div>
      </div>
    ),
    OG_SIZE,
  );
}
