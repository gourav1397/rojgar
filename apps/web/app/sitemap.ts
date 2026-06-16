import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rogjar.in";
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/jobs`, priority: 0.9 },
    { url: `${base}/login`, priority: 0.4 },
    { url: `${base}/register`, priority: 0.5 },
  ];
}
