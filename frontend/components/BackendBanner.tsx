"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export default function BackendBanner() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkHealth().then((ok) => setOffline(!ok));
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="w-full bg-[rgba(245,158,11,0.15)] border-b border-[rgba(245,158,11,0.3)] backdrop-blur-[16px] px-6 py-2.5 flex items-center justify-between text-xs z-[60]">
      <span className="text-amber-300">
        Backend offline — recommendations are unavailable. Make sure the FastAPI
        server is running on port 8000.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-300/60 hover:text-amber-300 ml-4 cursor-pointer"
        aria-label="Dismiss"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
