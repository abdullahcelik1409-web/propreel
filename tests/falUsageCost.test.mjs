import test from "node:test";
import assert from "node:assert/strict";

import {
  getFalUsageCostSummary,
  getFalUsageCredentials,
  getLocalDateString,
  summarizeFalUsageResponse,
} from "../lib/falUsageCost.mjs";

test("Fal usage credentials prefer the normal FAL_KEY", () => {
  assert.equal(getFalUsageCredentials({ FAL_KEY: "normal", FAL_API_KEY: "fallback" }), "normal");
  assert.equal(getFalUsageCredentials({ FAL_API_KEY: "fallback" }), "fallback");
});

test("Fal usage response summary totals cost by currency", () => {
  const summary = summarizeFalUsageResponse({
    time_series: [
      {
        results: [
          { cost: 0.4, currency: "USD" },
          { cost: "0.6", currency: "USD" },
        ],
      },
    ],
  });

  assert.equal(summary.cost, 1);
  assert.equal(summary.currency, "USD");
  assert.equal(summary.lineItemCount, 2);
});

test("local date string respects the configured dashboard timezone", () => {
  assert.equal(getLocalDateString(new Date("2026-06-13T21:30:00.000Z"), "Europe/Istanbul"), "2026-06-14");
});

test("Fal cost summary fetches real usage windows without mock values", async () => {
  const calledUrls = [];
  const fetchImpl = async (url, options) => {
    calledUrls.push({ url: String(url), authorization: options.headers.Authorization });
    return {
      ok: true,
      async json() {
        return {
          time_series: [
            {
              bucket: "2026-06-14T00:00:00Z",
              results: [{ cost: 1.25, currency: "USD" }],
            },
          ],
          next_cursor: null,
          has_more: false,
        };
      },
    };
  };

  const summary = await getFalUsageCostSummary({
    env: { FAL_KEY: "normal-key", FAL_USAGE_ALL_TIME_START: "2026-01-01" },
    fetchImpl,
    now: new Date("2026-06-14T09:00:00.000Z"),
  });

  assert.equal(calledUrls.length, 4);
  assert.ok(calledUrls.every((call) => call.authorization === "Key normal-key"));
  assert.equal(summary.windows.allTime.cost, 1.25);
  assert.equal(summary.windows.last30Days.cost, 1.25);
  assert.equal(summary.windows.last7Days.cost, 1.25);
  assert.equal(summary.windows.today.cost, 1.25);
});
