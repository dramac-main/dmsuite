import type { MetadataRoute } from "next";
import { toolCategories } from "@/data/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmsuite.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Dynamic tool pages
  const toolPages: MetadataRoute.Sitemap = toolCategories.flatMap((cat) =>
    cat.tools.map((tool) => ({
      url: `${siteUrl}/tools/${cat.id}/${tool.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  return [...staticPages, ...toolPages];
}
