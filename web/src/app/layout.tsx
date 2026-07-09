import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://school-health-hub.github.io/school-staff-training-center/";
const siteTitle = "학교 교직원 교육센터";
const siteDescription = "학교에서 바로 사용할 수 있는 Google Workspace 기반 교직원 교육 관리 시스템";

export const metadata: Metadata = {
  metadataBase: new URL("https://school-health-hub.github.io"),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "School Health Hub",
    images: [
      {
        url: "/school-staff-training-center/og-image.svg",
        width: 1200,
        height: 630,
        alt: "School Health Hub 교직원 교육센터"
      }
    ],
    locale: "ko_KR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/school-staff-training-center/og-image.svg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
