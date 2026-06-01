import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://menu-project-three-ruddy.vercel.app"),
  title: {
    default: "우리 뭐 먹지?",
    template: "%s | 우리 뭐 먹지?",
  },
  description: "친구들과 같이 먹고 싶은 메뉴를 골라보세요 🍻",
  applicationName: "우리 뭐 먹지?",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://menu-project-three-ruddy.vercel.app",
    siteName: "우리 뭐 먹지?",
    title: "우리 뭐 먹지?",
    description: "친구들과 같이 먹고 싶은 메뉴를 골라보세요 🍻",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "우리 뭐 먹지? 친구들과 같이 먹고 싶은 메뉴를 골라보세요",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "우리 뭐 먹지?",
    description: "친구들과 같이 먹고 싶은 메뉴를 골라보세요 🍻",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
