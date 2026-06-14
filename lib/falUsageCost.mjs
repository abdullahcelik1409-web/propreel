const FAL_USAGE_API_URL = "https://api.fal.ai/v1/models/usage";
const FAL_ACCOUNT_BILLING_API_URL = "https://api.fal.ai/v1/account/billing";
const FAL_BILLING_EVENTS_API_URL = "https://api.fal.ai/v1/models/billing-events";
const DEFAULT_USAGE_TIMEZONE = "Europe/Istanbul";
const DEFAULT_ALL_TIME_START = "2020-01-01";
const MAX_USAGE_PAGES = 50;
const RECENT_BILLING_EVENTS_LIMIT = 10;

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
  url.searchParams.set("expand", "time_series,summary,auth_method");
  if (cursor) url.searchParams.set("cursor", cursor);
  return url;
}

function buildBillingEventsUrl({ start, end, cursor }) {
  const url = new URL(FAL_BILLING_EVENTS_API_URL);
  url.searchParams.set("limit", String(RECENT_BILLING_EVENTS_LIMIT));
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  if (cursor) url.searchParams.set("cursor", cursor);
  return url;
}

function normalizeCost(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLabel(value, fallback = "Unknown") {
  const label = typeof value === "string" ? value.trim() : "";
  return label || fallback;
}

function addToGroup(groups, key, values = {}) {
  const normalizedKey = normalizeLabel(key);
  const existing = groups.get(normalizedKey) || {
    id: normalizedKey,
    label: normalizedKey,
    cost: 0,
    quantity: 0,
    lineItemCount: 0,
    currencyTotals: {},
  };
  const cost = normalizeCost(values.cost);
  const quantity = normalizeCost(values.quantity);
  const currency = String(values.currency || "USD").toUpperCase();

  existing.cost += cost;
  existing.quantity += quantity;
  existing.lineItemCount += 1;
  existing.currencyTotals[currency] = normalizeCost(existing.currencyTotals[currency]) + cost;
  groups.set(normalizedKey, existing);
}

function sortedGroups(groups, limit = 8) {
  return Array.from(groups.values())
    .sort((a, b) => b.cost - a.cost || b.quantity - a.quantity || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function summarizeFalUsageResponse(payload) {
  const currencyTotals = {};
  const buckets = new Map();
  const endpoints = new Map();
  const units = new Map();
  const authMethods = new Map();
  let lineItemCount = 0;
  let totalQuantity = 0;

  for (const bucket of Array.isArray(payload?.time_series) ? payload.time_series : []) {
    const bucketId = normalizeLabel(bucket?.bucket, "Unbucketed");
    const bucketTotals = buckets.get(bucketId) || {
      bucket: bucketId,
      cost: 0,
      quantity: 0,
      lineItemCount: 0,
      currencyTotals: {},
    };

    for (const item of Array.isArray(bucket?.results) ? bucket.results : []) {
      const cost = normalizeCost(item?.cost);
      const quantity = normalizeCost(item?.quantity);
      const currency = String(item?.currency || "USD").toUpperCase();

      currencyTotals[currency] = normalizeCost(currencyTotals[currency]) + cost;
      bucketTotals.currencyTotals[currency] = normalizeCost(bucketTotals.currencyTotals[currency]) + cost;
      bucketTotals.cost += cost;
      bucketTotals.quantity += quantity;
      bucketTotals.lineItemCount += 1;
      totalQuantity += quantity;
      lineItemCount += 1;

      addToGroup(endpoints, item?.endpoint_id, { cost, quantity, currency });
      addToGroup(units, item?.unit, { cost, quantity, currency });
      addToGroup(authMethods, item?.auth_method, { cost, quantity, currency });
    }

    buckets.set(bucketId, bucketTotals);
  }

  const currencies = Object.keys(currencyTotals);
  const currency = currencies.length === 1 ? currencies[0] : currencies.length ? "MIXED" : "USD";
  const cost = currencies.reduce((sum, key) => sum + normalizeCost(currencyTotals[key]), 0);
  const timeSeries = Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
  const activeBucketCount = timeSeries.filter((bucket) => bucket.cost > 0).length;

  return {
    cost,
    currency,
    currencyTotals,
    totalQuantity,
    lineItemCount,
    activeBucketCount,
    averageActiveBucketCost: activeBucketCount ? cost / activeBucketCount : 0,
    timeSeries,
    endpointBreakdown: sortedGroups(endpoints),
    unitBreakdown: sortedGroups(units),
    authMethodBreakdown: sortedGroups(authMethods),
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

async function fetchJson(url, { credentials, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Key ${credentials}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Fal.ai request failed with ${response.status}.`);
    error.status = response.status;
    error.payload = { error: error.message, details: body.slice(0, 500) };
    throw error;
  }

  return response.json();
}

async function fetchOptional(name, loader) {
  try {
    return { name, data: await loader(), error: null };
  } catch (error) {
    return {
      name,
      data: null,
      error: error?.message || `Could not load ${name}.`,
      status: error?.status || null,
    };
  }
}

function normalizeAccountBilling(payload) {
  if (!payload) return null;
  return {
    username: payload.username || null,
    credits: payload.credits
      ? {
          currentBalance: normalizeCost(payload.credits.current_balance),
          currency: String(payload.credits.currency || "USD").toUpperCase(),
        }
      : null,
  };
}

function normalizeBillingEvents(payload) {
  return (Array.isArray(payload?.billing_events) ? payload.billing_events : []).map((event) => ({
    requestId: event?.request_id || null,
    endpointId: event?.endpoint_id || "Unknown",
    timestamp: event?.timestamp || null,
    outputUnits: normalizeCost(event?.output_units),
    unitPrice: normalizeCost(event?.unit_price),
    percentDiscount: event?.percent_discount ?? null,
    costEstimateUsd: normalizeCost(event?.cost_estimate_nano_usd) / 1_000_000_000,
  }));
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
  const windowsById = Object.fromEntries(results);
  const recentWindow = windows.find((windowConfig) => windowConfig.id === "last30Days") || windows[1];
  const [accountBillingResult, billingEventsResult] = await Promise.all([
    fetchOptional("accountBilling", async () => normalizeAccountBilling(await fetchJson(new URL(`${FAL_ACCOUNT_BILLING_API_URL}?expand=credits`), { credentials, fetchImpl }))),
    fetchOptional("billingEvents", async () => normalizeBillingEvents(await fetchJson(buildBillingEventsUrl(recentWindow), { credentials, fetchImpl }))),
  ]);

  return {
    generatedAt: now.toISOString(),
    timezone: DEFAULT_USAGE_TIMEZONE,
    source: "fal.ai models usage API",
    windows: windowsById,
    accountBilling: accountBillingResult.data,
    recentBillingEvents: billingEventsResult.data || [],
    optionalErrors: [accountBillingResult, billingEventsResult]
      .filter((result) => result.error)
      .map((result) => ({ name: result.name, error: result.error, status: result.status })),
  };
}
