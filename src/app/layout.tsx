import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@shared/tokens.css";
import "./globals.css";
import { PrefsSync } from "@/components/PrefsSync";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE.name} · ${SITE.tagline_en}`,
  description: "Free, local-first tools. Nothing leaves your browser. No tracking, no servers.",
  metadataBase: new URL("https://www.freetoolslab.org"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrefsSync />
        {children}
      </body>
    </html>
  );
}
