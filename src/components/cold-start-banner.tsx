"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function ColdStartBanner() {
  const [isWarming, setIsWarming] = useState(false);

  useEffect(() => {
    const handleColdStart = (e: any) => {
      setIsWarming(Boolean(e.detail?.isWarming));
    };

    window.addEventListener("devdash:cold-start", handleColdStart);
    return () => {
      window.removeEventListener("devdash:cold-start", handleColdStart);
    };
  }, []);

  if (!isWarming) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-surface-2 border-b border-hairline py-2 px-4 text-xs font-mono text-ink-muted shadow-lg animate-in fade-in duration-200">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      <span>
        Connecting to server... (Render free-tier instance waking up, may take
        ~30s)
      </span>
    </div>
  );
}
