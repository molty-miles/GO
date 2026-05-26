import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { PrivyProvider } from "@/lib/providers/PrivyProvider";
import { AccaBuilderProvider } from "@/lib/providers/AccaBuilderProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { NavBar } from "@/components/layout/NavBar";
import { AccaFab } from "@/components/acca/AccaFab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GO Market – Cross-Platform Prediction Market Accumulator",
  description:
    "Combine prediction market bets from Polymarket, Kalshi, and Limitless into a single accumulator ticket.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PrivyProvider>
            <AccaBuilderProvider>
              <ToastProvider>
                <div className="flex">
                  <NavBar />
                  <main className="min-h-screen flex-1 md:ml-0">{children}</main>
                </div>
                <AccaFab />
              </ToastProvider>
            </AccaBuilderProvider>
          </PrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
