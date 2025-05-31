import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { GoogleAnalytics } from '@next/third-parties/google'

import "./globals.css";
import { SWRConfig } from "swr";
import { ClientCacheManager } from "./components/ClientCacheManager";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Binance Alpha Tracker",
  description: "Track your alpha points progress by entering your Binance keyless wallet address",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M17.0234 13.7824V16.4128C16.5737 16.5477 16.0117 16.6601 15.1799 16.6601C13.6061 16.6601 12.6169 16.1205 12.1673 14.9065C11.2905 15.9631 10.0315 16.75 8.16547 16.75C5.17536 16.75 2.5 14.5468 2.5 10.5225V10.4775C2.5 6.45324 5.1304 4.25 7.98561 4.25C9.80666 4.25 10.9308 5.08183 11.7401 6.04856V4.47482H15.1574V12.6133C15.1574 13.5351 15.5845 13.8498 16.3264 13.8498C16.5962 13.8498 16.8435 13.8273 17.0234 13.7824ZM8.86241 13.8498C10.4586 13.8498 11.7851 12.5234 11.7851 10.5225V10.4775C11.7851 8.47662 10.4586 7.15018 8.86241 7.15018C7.26619 7.15018 5.91727 8.45414 5.91727 10.4775V10.5225C5.91727 12.5234 7.26619 13.8498 8.86241 13.8498Z' fill='currentColor'/><path d='M17.5 0L20 2.5L17.5 5L15 2.5L17.5 0Z' fill='%23F0B90B'/></svg>" type="image/svg+xml" />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased dark`}
      >
        <SWRConfig>
          <NuqsAdapter>
            <ClientCacheManager>
              {children}
            </ClientCacheManager>
          </NuqsAdapter>
        </SWRConfig>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
