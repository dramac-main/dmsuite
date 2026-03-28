/*  AI Sidebar — placeholder for Chiko integration */
"use client";

export function AiSidebar() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-300">
        Chiko AI can help you design — just ask in the chat panel!
      </p>
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-xs text-gray-400">
        <p className="mb-2 font-medium text-gray-300">Try saying:</p>
        <ul className="space-y-1">
          <li>• &ldquo;Add a gold border&rdquo;</li>
          <li>• &ldquo;Change the title font to Cinzel&rdquo;</li>
          <li>• &ldquo;Make the background navy blue&rdquo;</li>
          <li>• &ldquo;Add a watermark at 20% opacity&rdquo;</li>
          <li>• &ldquo;Create a certificate for John Smith&rdquo;</li>
        </ul>
      </div>
      <p className="text-xs text-gray-500">
        Chiko has full control over every object on your canvas.
      </p>
    </div>
  );
}
