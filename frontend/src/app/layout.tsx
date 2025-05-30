import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life Planner - Your Productivity Companion",
  description:
    "Transform chaos into clarity with boards, tasks, calendars, and focus sessions all in one beautiful workspace.",
  keywords:
    "productivity, task management, calendar, focus timer, kanban, planning",
  authors: [{ name: "Life Planner Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#10B981",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Life Planner - Your Productivity Companion",
    description:
      "Transform chaos into clarity with comprehensive productivity tools",
    url: "https://lifeplanner.app",
    siteName: "Life Planner",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Life Planner Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Planner - Your Productivity Companion",
    description:
      "Transform chaos into clarity with comprehensive productivity tools",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <div id="root" className="min-h-screen">
          {children}
        </div>
        {/* Portal for modals and overlays */}
        <div id="modal-root" />
        <div id="tooltip-root" />
        <div id="notification-root" />
      </body>
    </html>
  );
}
