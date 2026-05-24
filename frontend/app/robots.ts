import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block all private/auth-walled routes from being crawled or indexed.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/chat",
          "/chat/",
          "/profile",
          "/profile/",
          "/onboarding",
          "/onboarding/",
          "/login",
          "/login/",
          "/post",
          "/post/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
