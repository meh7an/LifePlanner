// app/layout.tsx - Root layout for the entire application
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "react-hot-toast";

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
        <AuthInitializer>
          <div id="root" className="min-h-screen">
            {children}
          </div>
        </AuthInitializer>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#1f2937",
              borderRadius: "12px",
              border: "1px solid #d1fae5",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />

        {/* Portal containers for modals and overlays */}
        <div id="modal-root" />
        <div id="tooltip-root" />
        <div id="notification-root" />
      </body>
    </html>
  );
}
