import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Static OG image used as the default for the homepage and pages that
// do not provide their own opengraph-image. Generated at build time.
export const alt = `${SITE_NAME} — India's Student Marketplace`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
          padding: "72px 84px",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#f97316",
              color: "white",
              fontWeight: 900,
              fontSize: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            S
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#0f172a" }}>
            <span>Sell</span>
            <span style={{ color: "#f97316" }}>Chey</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            <span>India&apos;s student marketplace for </span>
            <span style={{ color: "#f97316", marginLeft: 14 }}>college essentials</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#475569",
              fontWeight: 500,
              maxWidth: 880,
              marginTop: 12,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#475569",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", background: "#fed7aa", color: "#c2410c", padding: "8px 16px", borderRadius: 999 }}>JEE</div>
          <div style={{ display: "flex", background: "#fed7aa", color: "#c2410c", padding: "8px 16px", borderRadius: 999 }}>NEET</div>
          <div style={{ display: "flex", background: "#fed7aa", color: "#c2410c", padding: "8px 16px", borderRadius: 999 }}>EAPCET</div>
          <div style={{ display: "flex", background: "#fed7aa", color: "#c2410c", padding: "8px 16px", borderRadius: 999 }}>IPE</div>
          <div style={{ display: "flex", marginLeft: "auto", color: "#0f172a" }}>sellchey.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
