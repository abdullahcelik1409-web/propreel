const FAL_USAGE_API_URL = "https://api.fal.ai/v1/models/usage";
const DEFAULT_USAGE_TIMEZONE = "Europe/Istanbul";
const DEFAULT_ALL_TIME_START = "2020-01-01";
const MAX_USAGE_PAGES = 50;

export function getFalUsageCredentials(env = process.env) {
  return env.FAL_ADMIN_KEY || env.FAL_KEY || env.FAL_API_KEY || "";
}

export function getLocalDateString(date = new Date(), timeZone = DEFAULT_USAGE_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function buildUsageWindows(now = new Date(), env = process.env) {
  const today = getLocalDateString(now, DEFAULT_USAGE_TIMEZONE);
  const end = now.toISOString();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: "allTime",
      label: "All-time API cost",
      start: env.FAL_USAGE_ALL_TIME_START || DEFAULT_ALL_TIME_START,
      end,
      fallbackStart: today,
      timeframe: "month",
    },
    {
      id: "last30Days",
      label: "Last 30 days API cost",
      start: new Date(now.getTime() - 30 * dayMs).toISOString(),
      end,
      timeframe: "day",
    },
    {
      id: "last7Days",
      label: "Last 7 days API cost",
      start: new Date(now.getTime() - 7 * dayMs).toISOString(),
      end,
      timeframe: "day",
    },
    {
      id: "today",
      label: "Today's API cost",
      start: today,
      end,
      timeframe: "hour",
    },
  ];
}

function buildUsageUrl({ start, end, timeframe, cursor }) {
  const url = new URL(FAL_USAGE_API_URL);
  url.searchParams.set("limit", "1000");
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("timezone", DEFAULT_USAGE_TIMEZONE);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("bound_to_timeframe", "false");
  url.searchParams.set("expand", "time_series");
  if (cursor) url.searchParams.set("cursor", cursor);
  return url;
}

function normalizeCost(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function summarizeFalUsageResponse(payload) {
  const currencyTotals = {};
  let lineItemCount = 0;

  for (const bucket of Array.isArray(payload?.time_series) ? payload.time_series : []) {
    for (const item of Array.isArray(bucket?.results) ? bucket.results : []) {
      const cost = normalizeCost(item?.cost);
      if (!cost) continue;

      const currency = String(item?.currency || "USD").toUpperCase();
      currencyTotals[currency] = normalizeCost(currencyTotals[currency]) + cost;
      lineItemCount += 1;
    }
  }

  const currencies = Object.keys(currencyTotals);
  const currency = currencies.length === 1 ? currencies[0] : currencies.length ? "MIXED" : "USD";
  const cost = currencies.reduce((sum, key) => sum + normalizeCost(currencyTotals[key]), 0);

  return {
    cost,
    currency,
    currencyTotals,
    lineItemCount,
  };
}

async function fetchFalUsageWindow(windowConfig, { credentials, fetchImpl = fetch } = {}) {
  let cursor = null;
  let hasMore = true;
  let pageCount = 0;
  const combined = {
    time_series: [],
  };

  while (hasMore) {
    pageCount += 1;
    if (pageCount > MAX_USAGE_PAGES) {
      const error = new Error("Fal.ai usage pagination exceeded the local safety limit.");
      error.status = 502;
      throw error;
    }

    const response = await fetchImpl(buildUsageUrl({ ...windowConfig, cursor }), {
      headers: {
        Authorization: `Key ${credentials}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const error = new Error(`Fal.ai usage request failed with ${response.status}.`);
      error.status = response.status;
      error.payload = { error: error.message, details: body.slice(0, 500) };
      throw error;
    }

    const payload = await response.json();
    combined.time_series.push(...(Array.isArray(payload?.time_series) ? payload.time_series : []));
    cursor = payload?.next_cursor || null;
    hasMore = Boolean(payload?.has_more && cursor);
  }

  return summarizeFalUsageResponse(combined);
}

async function fetchWindowWithFallback(windowConfig, options) {
  try {
    return {
      ...(await fetchFalUsageWindow(windowConfig, options)),
      fallbackApplied: false,
      start: windowConfig.start,
      end: windowConfig.end,
    };
  } catch (error) {
    if (!windowConfig.fallbackStart || error.status !== 400) {
      throw error;
    }

    const fallbackWindow = { ...windowConfig, start: windowConfig.fallbackStart, timeframe: "day" };
    return {
      ...(await fetchFalUsageWindow(fallbackWindow, options)),
      fallbackApplied: true,
      start: fallbackWindow.start,
      end: fallbackWindow.end,
      fallbackReason: "Fal.ai rejected the broader all-time usage range.",
    };
  }
}

export async function getFalUsageCostSummary({ env = process.env, fetchImpl = fetch, now = new Date() } = {}) {
  const credentials = getFalUsageCredentials(env);
  if (!credentials) {
    const error = new Error("Fal.ai API key missing. Set FAL_ADMIN_KEY, FAL_KEY, or FAL_API_KEY.");
    error.status = 500;
    throw error;
  }

  const windows = buildUsageWindows(now, env);
  const results = await Promise.all(
    windows.map(async (windowConfig) => {
      const summary = await fetchWindowWithFallback(windowConfig, { credentials, fetchImpl });
      return [windowConfig.id, { ...windowConfig, ...summary }];
    }),
  );

  return {
    generatedAt: now.toISOString(),
    timezone: DEFAULT_USAGE_TIMEZONE,
    source: "fal.ai models usage API",
    windows: Object.fromEntries(results),
  };
}
