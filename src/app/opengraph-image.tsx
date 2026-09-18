import { ImageResponse } from "next/og";

export const alt = "NASAMAP — Every human has a seat at the frontier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #0b1120 0%, #030712 100%)",
        color: "white",
        fontFamily: "Helvetica, Arial, sans-serif",
        padding: "72px 88px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            border: "3px solid #22d3ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#22d3ee",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          N
        </div>
        <div style={{ fontSize: 30, letterSpacing: 3, fontWeight: 700, color: "#22d3ee" }}>NASAMAP</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
          Every human has a seat
          <br />
          at the frontier.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#94a3b8", maxWidth: 900 }}>
          Plan, fly and live a real Moon-to-Mars mission — made with open NASA data, for the Space Apps Challenge.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 20 }}>
        <span>Mission Design Game · live orbital data · cosmic commons</span>
        <span>NASA Space Apps 2026</span>
      </div>
    </div>,
    { ...size },
  );
}