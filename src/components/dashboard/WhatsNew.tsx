"use client";

import { useState } from "react";
import Link from "next/link";
import { changelog, type ChangelogEntry } from "@/data/changelog";
import { IconSparkles } from "@/components/icons";

const typeConfig: Record<
  ChangelogEntry["type"],
  { label: string; bg: string; text: string }
> = {
  feature: {
    label: "New",
    bg: "bg-primary-500/15",
    text: "text-primary-400",
  },
  improvement: {
    label: "Improved",
    bg: "bg-secondary-500/15",
    text: "text-secondary-400",
  },
  fix: {
    label: "Fixed",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
  },
  announcement: {
    label: "News",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function WhatsNew() {
  const INITIAL_COUNT = 4;
  const [showAll, setShowAll] = useState(false);

  const entries = showAll ? changelog : changelog.slice(0, INITIAL_COUNT);
  const hasMore = changelog.length > INITIAL_COUNT;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconSparkles className="size-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            What&apos;s New
          </h2>
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            {showAll ? "Show less" : `View all (${changelog.length})`}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const cfg = typeConfig[entry.type];
          const inner = (
            <div
              className="group relative rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm
                         p-4 hover:border-primary-500/30 hover:bg-white/8 transition-all"
            >
              {/* Top row: badge + version + date */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`${cfg.bg} ${cfg.text} text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}
                >
                  {cfg.label}
                </span>
                <span className="text-[0.625rem] text-gray-500 font-mono">
                  v{entry.version}
                </span>
                <span className="ml-auto text-[0.625rem] text-gray-500">
                  {timeAgo(entry.date)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-100 mb-1 group-hover:text-primary-300 transition-colors">
                {entry.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                {entry.description}
              </p>
            </div>
          );

          if (entry.toolId) {
            return (
              <Link
                key={entry.id}
                href={`/tools/${entry.toolId}`}
                className="block"
              >
                {inner}
              </Link>
            );
          }

          return <div key={entry.id}>{inner}</div>;
        })}
      </div>
    </section>
  );
}
