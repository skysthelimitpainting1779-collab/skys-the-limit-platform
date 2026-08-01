import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex/provider";
import { NavigationHeader } from "@/components/navigation/Header";
import { NavigationFooter } from "@/components/navigation/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sky's the Limit Painting LLC",
    template: "%s | Sky's the Limit Painting LLC",
  },
  description:
    "Prep-first painting estimates for Twin Cities homes, commercial properties, and public assets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <ConvexClientProvider>
          <NavigationHeader />
          <div className="flex-1">{children}</div>
          <NavigationFooter />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
