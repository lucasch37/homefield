import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Homefield — A clearer picture of home",
  description:
    "Explore satellite observations of flooding, surface heat, and slow ground movement at your King County address, with sources and limitations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "scroll-smooth font-sans motion-reduce:scroll-auto",
        inter.variable,
      )}
    >
      <body className="m-0 bg-background text-sm text-foreground antialiased">
        <div className="mx-auto max-w-[1536px] px-[6.3%] max-[1050px]:px-[5%] max-[760px]:px-[6%]">
          <Navbar />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
