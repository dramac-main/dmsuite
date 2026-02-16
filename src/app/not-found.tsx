"use client";

import Link from "next/link";
import { IconHome } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        {/* Glitch number */}
        <div className="relative mb-6">
          <span className="text-8xl sm:text-9xl font-black text-gray-200 dark:text-gray-800 select-none">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-8xl sm:text-9xl font-black text-primary-500/20">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary-500 text-gray-950 font-semibold rounded-xl hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
          >
            <IconHome className="size-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 h-10 px-5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
