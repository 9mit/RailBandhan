import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/home", "/explore", "/help"],
      disallow: [
        "/api/",
        "/profile",
        "/journeys",
        "/chat",
        "/dm",
        "/communities",
        "/notifications",
        "/moderation",
        "/onboarding",
        "/login",
        "/signup",
        "/games/",
      ],
    },
    sitemap: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
      : undefined,
  };
}
