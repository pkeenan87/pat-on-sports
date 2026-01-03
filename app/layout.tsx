import "./globals.css";
import { Suspense } from "react";
import Header from "@/components/Header";
import { getAllPosts, getAllTags } from "@/lib/posts";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://patonsports.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pat on Sports",
    template: "%s | Pat on Sports",
  },
  description:
    "Pat on Sports — weekly Patriots Pros & Cons, NFL analysis, previews, and takes.",
  openGraph: {
    type: "website",
    siteName: "Pat on Sports",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tags = getAllTags(); // ✅ server-side: reads markdown tags

    return (
        <html lang="en">
            <body className="bg-slate-50 text-slate-900">
            <Suspense fallback={<div className="h-16 border-b bg-white" />}>
          <Header tags={tags} />
        </Suspense>
                <main>{children}</main>
                {/* Vercel Analytics */}
        <Analytics />
            </body>
        </html>
    );
}
