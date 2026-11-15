import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return [];
  return ["/home", "/explore", "/help"].map((path) => ({
    url: `${base}${path}`,
  }));
}
