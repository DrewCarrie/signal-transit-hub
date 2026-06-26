import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "Signal Transit Hub",
  description: "A Base Mini App for three onchain transit signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="base:app_id" content="6a3e1b8d83b1b97823e06e8a" />
        <meta
          name="talentapp:project_verification"
          content="5fbe7d0e8a03b170e8bcced2d1ba00a2654d91f0d14cd937be7d07934cad9cbeec25823ab2c180f5de2eeda86a6d3dec90eacf2a4f9b26425ad376c688d66196"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
