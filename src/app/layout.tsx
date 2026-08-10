import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const mono = Geist_Mono({
  variable: "--font-data",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sé personero — Renovación Popular",
  description:
    "Si eres de Lima, Rafael te necesita en tu mesa. Un día y cobras por Yape o Plin.",
  icons: {
    icon: [
      {
        url: "/brands/renovacion-popular/logo-r.png",
        type: "image/png",
        sizes: "any",
      },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      {
        url: "/brands/renovacion-popular/logo-r.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: "/brands/renovacion-popular/logo-r.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
