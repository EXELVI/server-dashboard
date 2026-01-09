import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"]
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"]
});

export const metadata: Metadata = {
   title: "Server Monitor",
   description: "Dashboard for monitoring server stats",
   openGraph: {
      title: "Server Monitor",
      description: "Dashboard for monitoring server stats",
      type: "website",
      images: [
         {
            url: "/api/og",
            width: 1200,
            height: 630,
            alt: "Server Monitor"
         }
      ]
   },
   twitter: {
      card: "summary_large_image",
      title: "Server Monitor",
      description: "Dashboard for monitoring server stats",
      images: ["/api/og"]
   }
};

export default function RootLayout({
   children
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en">
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
            data-theme="dark"
            style={{ colorScheme: "dark" }}>
            {children}
         </body>
      </html>
   );
}
