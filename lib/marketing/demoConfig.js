export const DEMO_SIGNUP_PATH = "/auth/register";
export const DEMO_STORAGE_BUCKET = "media";
export const DEMO_FALLBACK_LABEL = "Demo video placeholder - replace with final video file.";
export const DEMO_TRACKING_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "rid",
];
export const DEMO_EVENT_NAMES = [
  "demo_page_view",
  "demo_video_play",
  "demo_video_50",
  "demo_video_complete",
  "demo_cta_click",
  "demo_signup_click",
];
export const DEMO_EVENT_NAME_SET = new Set(DEMO_EVENT_NAMES);
export const DEMO_TRACKING_STORAGE_KEY = "viseo_demo_tracking";
export const DEMO_SESSION_STORAGE_KEY = "viseo_demo_session_id";

export const DEMO_VIDEO_DEFINITIONS = [
  {
    id: "standard_listing",
    title: "Standard Listing Video",
    description: "Turn everyday listing photos into a clean, ready-to-post property video.",
    storagePath: "marketing/demo/demo-standard.mp4",
  },
  {
    id: "luxury_property",
    title: "Luxury Property Video",
    description: "Give premium listings a cinematic video look without manual editing.",
    storagePath: "marketing/demo/demo-luxury.mp4",
  },
  {
    id: "before_after",
    title: "Before / After Photo-to-Video",
    description: "See how static property photos can become a short social media video.",
    storagePath: "marketing/demo/demo-before-after.mp4",
  },
];

const FIELD_LIMITS = {
  session_id: 120,
  event_name: 64,
  demo_id: 64,
  cta_id: 64,
  utm_source: 120,
  utm_medium: 120,
  utm_campaign: 160,
  utm_content: 160,
  utm_term: 160,
  rid: 160,
  page_path: 256,
  referrer: 512,
  user_agent: 512,
};

function normalizeString(value, limit) {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, limit);
}

export function getSiteUrl(siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://getviseo.com") {
  return String(siteUrl || "https://getviseo.com").replace(/\/$/, "");
}

export function pickDemoTrackingParams(source = {}) {
  const values = source instanceof URLSearchParams ? Object.fromEntries(source.entries()) : source;
  const params = {};
  for (const key of DEMO_TRACKING_PARAM_KEYS) {
    const value = normalizeString(values?.[key], FIELD_LIMITS[key]);
    if (value) params[key] = value;
  }
  return params;
}

export function mergeDemoTrackingParams(primary = {}, fallback = {}) {
  return {
    ...pickDemoTrackingParams(fallback),
    ...pickDemoTrackingParams(primary),
  };
}

export function buildPathWithTracking(pathname, trackingParams = {}) {
  const url = new URL(pathname, getSiteUrl());
  const normalizedParams = pickDemoTrackingParams(trackingParams);
  Object.entries(normalizedParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildDemoUrl({
  baseUrl = getSiteUrl(),
  source,
  medium,
  campaign,
  content,
  term,
  rid,
} = {}) {
  const url = new URL("/demo", getSiteUrl(baseUrl));
  const trackingParams = pickDemoTrackingParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
    utm_term: term,
    rid,
  });
  Object.entries(trackingParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export function buildSignupUrl(trackingParams = {}) {
  return buildPathWithTracking(DEMO_SIGNUP_PATH, trackingParams);
}

export function getPublicSupabaseObjectUrl(storagePath, {
  supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VISEO_SUPABASE_PROJECT_URL || "",
  bucket = DEMO_STORAGE_BUCKET,
} = {}) {
  const normalizedBase = String(supabaseUrl || "").replace(/\/$/, "");
  if (!normalizedBase) return null;
  const safePath = String(storagePath || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${normalizedBase}/storage/v1/object/public/${encodeURIComponent(bucket)}/${safePath}`;
}

export function getDemoVideos(options = {}) {
  return DEMO_VIDEO_DEFINITIONS.map((video) => ({
    ...video,
    videoUrl: getPublicSupabaseObjectUrl(video.storagePath, options),
    fallbackLabel: DEMO_FALLBACK_LABEL,
  }));
}

export function sanitizeDemoEventPayload(body = {}, requestContext = {}) {
  const eventName = normalizeString(body?.event_name, FIELD_LIMITS.event_name);
  if (!DEMO_EVENT_NAME_SET.has(eventName)) {
    return { error: "Invalid event_name", data: null };
  }

  const data = {
    sessionId: normalizeString(body?.session_id, FIELD_LIMITS.session_id) || null,
    eventName,
    demoId: normalizeString(body?.demo_id, FIELD_LIMITS.demo_id) || null,
    ctaId: normalizeString(body?.cta_id, FIELD_LIMITS.cta_id) || null,
    utmSource: normalizeString(body?.utm_source, FIELD_LIMITS.utm_source) || null,
    utmMedium: normalizeString(body?.utm_medium, FIELD_LIMITS.utm_medium) || null,
    utmCampaign: normalizeString(body?.utm_campaign, FIELD_LIMITS.utm_campaign) || null,
    utmContent: normalizeString(body?.utm_content, FIELD_LIMITS.utm_content) || null,
    utmTerm: normalizeString(body?.utm_term, FIELD_LIMITS.utm_term) || null,
    rid: normalizeString(body?.rid, FIELD_LIMITS.rid) || null,
    pagePath: normalizeString(requestContext.pagePath ?? body?.page_path, FIELD_LIMITS.page_path) || "/demo",
    referrer: normalizeString(requestContext.referrer ?? body?.referrer, FIELD_LIMITS.referrer) || null,
    userAgent: normalizeString(requestContext.userAgent, FIELD_LIMITS.user_agent) || null,
  };

  return { error: null, data };
}
