"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function VideoStatusPoller({ jobId, enabled = true, onComplete }) {
  const notified = useRef(false);

  useEffect(() => {
    if (!enabled || !jobId) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/videos/status/${jobId}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (data.status === "completed" && !notified.current) {
          notified.current = true;
          toast.success("Your property video is ready.");
          onComplete?.(data.video);
        }
        if (data.status === "failed" && !notified.current) {
          notified.current = true;
          toast.error("Video generation failed.");
        }
        if (data.status === "refunded" && !notified.current) {
          notified.current = true;
          toast.error("Video generation failed. Credits were refunded.");
          onComplete?.(data.video);
        }
      } catch {
        // Keep polling quietly; transient queue/network misses are expected.
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, jobId, onComplete]);

  return null;
}
