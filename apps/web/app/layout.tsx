import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rogjar.in"),
  title: {
    default: "Rogjar - Jobs and Hiring Marketplace",
    template: "%s | Rogjar",
  },
  description: "Rogjar connects candidates, employers, and admins in a production-ready job marketplace.",
  openGraph: {
    title: "Rogjar",
    description: "Find jobs, hire talent, and manage applications.",
    type: "website",
    url: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
