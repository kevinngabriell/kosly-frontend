import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { COMPANY_NAME, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} by ${COMPANY_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Raw hex on purpose: ImageResponse renders outside Chakra, so theme tokens aren't available here.
// Values mirror src/theme/system.ts (primary.600, secondary.100, accent.100, gray text/background).
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#FFF3F1",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: "#D7F5F2",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -110,
            right: 180,
            width: 300,
            height: 300,
            borderRadius: 9999,
            background: "#FFE8AD",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              background: "#F14848",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="76"
              height="76"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, color: "#D62F2F", display: "flex" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 820 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, color: "#211D19", display: "flex" }}>
            {t("tagline")}
          </div>
          <div style={{ fontSize: 30, color: "#4F473F", display: "flex" }}>
            {`by ${COMPANY_NAME}`}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
