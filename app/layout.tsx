import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stack Privacy",
  description: "Scan your GitHub profile and discover which tools in your dev stack are tracking your users. Get a privacy score and swap to better alternatives.",
  openGraph: {
    title: "Stack Privacy — Exposed dev stack?",
    description: "Scan your GitHub repos and get a tracking score. Most devs don't realize what's watching them.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack Privacy — Exposed dev stack?",
    description: "I checked my stack privacy score. Most devs don't realize this 👀",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
