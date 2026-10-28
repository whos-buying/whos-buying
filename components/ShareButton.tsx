"use client";

import { useState } from "react";

export function ShareButton({ text, path }: { text: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // Cancelled, or the share sheet isn't available. Fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this:", `${text} ${url}`);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="w-full rounded-md bg-highlight px-5 py-3 font-display text-lg uppercase tracking-wide text-[#141414] hover:opacity-90"
    >
      {copied ? "Copied. Paste it anywhere" : "Share these receipts"}
    </button>
  );
}
