"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";
import { getIcon, IconGrid, IconArrowRight } from "@/components/icons";

interface Collection {
  title: string;
  description: string;
  filter: (tool: FlatTool) => boolean;
  color: string;
}

const COLLECTIONS: Collection[] = [
  {
    title: "Quick Wins",
    description: "Tools ready to use right now",
    filter: (t) => t.status === "ready",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    title: "Design Essentials",
    description: "Logos, brands, social media",
    filter: (t) =>
      t.status === "ready" &&
      ["logo-generator", "brand-identity", "social-media-post", "poster", "banner-ad", "business-card"].includes(t.id),
    color: "from-primary-500/20 to-primary-500/5",
  },
  {
    title: "Business Documents",
    description: "Invoices, proposals, contracts",
    filter: (t) =>
      t.status === "ready" &&
      t.categoryId === "business-documents",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    title: "Content Creation",
    description: "Blogs, captions, emails",
    filter: (t) =>
      t.status === "ready" &&
      (t.categoryId === "content-writing" || t.categoryId === "marketing-sales"),
    color: "from-amber-500/20 to-amber-500/5",
  },
];

export default function ExploreSection() {
  const all = useMemo(() => getAllToolsFlat(), []);

  const collections = useMemo(
    () =>
      COLLECTIONS.map((c) => ({
        ...c,
        tools: all.filter(c.filter).slice(0, 6),
      })).filter((c) => c.tools.length >= 2),
    [all]
  );

  if (collections.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconGrid className="size-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Explore
          </h2>
        </div>
      </div>

      {/* Collection cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((col) => (
          <div
            key={col.title}
            className="rounded-xl border border-white/5 overflow-hidden hover:border-primary-500/20 transition-all group"
          >
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${col.color} p-4 pb-3`}>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                {col.title}
              </h3>
              <p className="text-[10px] text-gray-400">{col.description}</p>
            </div>

            {/* Tool list */}
            <div className="bg-white/5 backdrop-blur-sm p-2 space-y-0.5">
              {col.tools.map((tool) => {
                const Icon = getIcon(tool.icon);
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.categoryId}/${tool.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group/item"
                  >
                    <div className="size-6 rounded-md bg-primary-500/10 flex items-center justify-center shrink-0">
                      <Icon className="size-3 text-primary-400" />
                    </div>
                    <span className="text-xs text-gray-300 truncate flex-1">
                      {tool.name}
                    </span>
                    <IconArrowRight className="size-3 text-gray-600 group-hover/item:text-primary-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
