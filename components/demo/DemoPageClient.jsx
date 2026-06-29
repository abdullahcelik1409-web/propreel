"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSignupUrl,
  DEMO_FALLBACK_LABEL,
  DEMO_SESSION_STORAGE_KEY,
  DEMO_TRACKING_STORAGE_KEY,
  mergeDemoTrackingParams,
  pickDemoTrackingParams,
} from "@/lib/marketing/demoConfig";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `demo_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function sendGtagEvent(eventName, payload) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, payload);
}

function sendEventToApi(payload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/analytics/demo-event", blob)) {
      return;
    }
  } catch {}

  fetch("/api/analytics/demo-event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => null);
}

function trackDemoEvent({ eventName, trackingParams, sessionId, demoId = null, ctaId = null }) {
  if (!sessionId) return;

  const payload = {
    session_id: sessionId,
    event_name: eventName,
    demo_id: demoId,
    cta_id: ctaId,
    page_path: typeof window !== "undefined" ? window.location.pathname : "/demo",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    ...trackingParams,
  };

  sendEventToApi(payload);
  sendGtagEvent(eventName, {
    demo_id: demoId || undefined,
    cta_id: ctaId || undefined,
    ...trackingParams,
    page_path: payload.page_path,
  });
}

function DemoVideoCard({ demo, trackingParams, sessionId }) {
  const [hasError, setHasError] = useState(!demo.videoUrl);
  const playTrackedRef = useRef(false);
  const halfTrackedRef = useRef(false);

  return (
    <article className="pr-card overflow-hidden rounded-[28px] border border-[var(--pr-border-soft)] bg-[#071010]">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#081414]">
        {hasError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-[var(--pr-muted)]">
            {demo.fallbackLabel || DEMO_FALLBACK_LABEL}
          </div>
        ) : (
          <video
            src={demo.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover lg:object-contain"
            onError={() => setHasError(true)}
            onPlay={() => {
              if (playTrackedRef.current) return;
              playTrackedRef.current = true;
              trackDemoEvent({
                eventName: "demo_video_play",
                trackingParams,
                sessionId,
                demoId: demo.id,
              });
            }}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (halfTrackedRef.current || !video.duration) return;
              if (video.currentTime / video.duration >= 0.5) {
                halfTrackedRef.current = true;
                trackDemoEvent({
                  eventName: "demo_video_50",
                  trackingParams,
                  sessionId,
                  demoId: demo.id,
                });
              }
            }}
            onEnded={() => {
              trackDemoEvent({
                eventName: "demo_video_complete",
                trackingParams,
                sessionId,
                demoId: demo.id,
              });
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071010] via-[#071010]/65 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--pr-cyan)]">Demo</p>
        <h3 className="text-xl font-black tracking-tight text-white">{demo.title}</h3>
        <p className="text-sm leading-6 text-[var(--pr-muted)]">{demo.description}</p>
      </div>
    </article>
  );
}

export default function DemoPageClient({ demoVideos = [], initialTrackingParams = {} }) {
  const [trackingParams, setTrackingParams] = useState(() => pickDemoTrackingParams(initialTrackingParams));
  const [sessionId, setSessionId] = useState("");
  const pageViewTrackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let storedParams = {};
    try {
      storedParams = pickDemoTrackingParams(JSON.parse(sessionStorage.getItem(DEMO_TRACKING_STORAGE_KEY) || "{}"));
    } catch {
      storedParams = {};
    }

    const mergedParams = mergeDemoTrackingParams(initialTrackingParams, storedParams);
    try {
      sessionStorage.setItem(DEMO_TRACKING_STORAGE_KEY, JSON.stringify(mergedParams));
      const existingSessionId = sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
      const nextSessionId = existingSessionId || createSessionId();
      sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, nextSessionId);
      setSessionId(nextSessionId);
    } catch {
      setSessionId(createSessionId());
    }

    setTrackingParams(mergedParams);
  }, [initialTrackingParams]);

  useEffect(() => {
    if (!sessionId || pageViewTrackedRef.current) return;
    pageViewTrackedRef.current = true;
    trackDemoEvent({
      eventName: "demo_page_view",
      trackingParams,
      sessionId,
    });
  }, [sessionId, trackingParams]);

  const signupHref = useMemo(() => buildSignupUrl(trackingParams), [trackingParams]);

  const primaryCtaProps = (ctaId) => ({
    href: signupHref,
    onClick: () => {
      trackDemoEvent({
        eventName: "demo_cta_click",
        trackingParams,
        sessionId,
        ctaId,
      });
      trackDemoEvent({
        eventName: "demo_signup_click",
        trackingParams,
        sessionId,
        ctaId,
      });
    },
  });

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-0 grid max-w-[390px] gap-8 px-4 pb-14 pt-10 sm:mx-auto sm:max-w-7xl sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pb-24 lg:pt-16">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full border border-[var(--pr-cyan)]/30 bg-[var(--pr-cyan-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--pr-cyan)]">
            Public demo
          </span>
          <h1 className="mt-5 max-w-[22rem] text-4xl font-black leading-[1.02] tracking-tight text-white sm:max-w-3xl sm:text-5xl lg:text-6xl">
            Turn listing photos into ready-to-post real estate videos
          </h1>
          <p className="mt-6 max-w-[22rem] text-base leading-7 text-[var(--pr-muted)] sm:max-w-2xl sm:text-lg sm:leading-8">
            Viseo helps real estate agents create short AI property videos from existing listing photos - no editing required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link {...primaryCtaProps("hero_primary")} className="pr-primary px-5 py-3 text-center">
              Create your first listing video
            </Link>
            <a href="#demo-videos" className="pr-secondary px-5 py-3 text-center font-semibold">
              Watch demos
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="pr-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Input</p>
              <p className="mt-2 text-lg font-black text-white">Listing photos</p>
            </div>
            <div className="pr-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Output</p>
              <p className="mt-2 text-lg font-black text-white">Short-form property video</p>
            </div>
            <div className="pr-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--pr-dim)]">Channels</p>
              <p className="mt-2 text-lg font-black text-white">Reels, Shorts, LinkedIn</p>
            </div>
          </div>
        </div>

        <div className="pr-section p-5">
          <p className="pr-kicker">Why Viseo</p>
          <h2 className="mt-2 text-2xl font-black text-white">Static photos are not enough for modern property promotion.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--pr-muted)]">
            Most property listings still rely on static photo carousels. Viseo turns the photos agents already have into short, social-ready property videos for Instagram, TikTok, YouTube Shorts and LinkedIn.
          </p>
          <div className="mt-6 space-y-3">
            {[
              "Use the listing photos you already have",
              "Create polished AI video output without manual editing",
              "Publish faster across social and listing channels",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--pr-cyan)]" />
                <p className="text-sm leading-6 text-[var(--pr-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-videos" className="mx-0 max-w-[390px] px-4 pb-16 sm:mx-auto sm:max-w-7xl sm:px-6 lg:pb-24">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pr-kicker">Demo videos</p>
            <h2 className="mt-2 text-3xl font-black text-white">See real demo outputs</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--pr-muted)]">
            Watch how existing property photos can be turned into short, mobile-first video assets for modern real estate marketing.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {demoVideos.map((demo) => (
            <DemoVideoCard
              key={demo.id}
              demo={demo}
              trackingParams={trackingParams}
              sessionId={sessionId}
            />
          ))}
        </div>
      </section>

      <section className="mx-0 max-w-[390px] px-4 pb-16 sm:mx-auto sm:max-w-7xl sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="pr-section p-5">
            <p className="pr-kicker">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-white">From listing photos to social-ready video</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Upload listing photos"],
                ["02", "Generate an AI property video"],
                ["03", "Post it on social media"],
              ].map(([step, label]) => (
                <div key={step} className="rounded-2xl border border-[var(--pr-border-soft)] bg-[#071010] p-4">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--pr-cyan)]">{step}</p>
                  <p className="mt-3 text-lg font-bold text-white">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pr-section p-5">
            <p className="pr-kicker">Who it is for</p>
            <h2 className="mt-2 text-3xl font-black text-white">Built for real estate teams that need faster content output</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Real estate agents",
                "Brokers",
                "Property marketers",
                "Real estate photographers",
                "Virtual staging agencies",
              ].map((item) => (
                <span key={item} className="rounded-full border border-[var(--pr-border-soft)] bg-[#071010] px-4 py-2 text-sm font-semibold text-[var(--pr-muted)]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-0 max-w-[390px] px-4 pb-16 sm:mx-auto sm:max-w-7xl sm:px-6">
        <div className="pr-section p-5">
          <p className="pr-kicker">Transparency note</p>
          <h2 className="mt-2 text-3xl font-black text-white">What you are seeing on this page</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--pr-muted)]">
            These are AI-generated demo examples shared for product demonstration. Final output quality depends on the input photos, selected format, and listing context provided by the user.
          </p>
        </div>
      </section>

      <section className="mx-0 max-w-[390px] px-4 pb-20 sm:mx-auto sm:max-w-7xl sm:px-6 lg:pb-28">
        <div className="pr-section overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="pr-kicker">Ready to try</p>
              <h2 className="mt-2 text-3xl font-black text-white">Create your first listing video with Viseo</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link {...primaryCtaProps("final_primary")} className="pr-primary px-6 py-3 text-center">
                Try Viseo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
