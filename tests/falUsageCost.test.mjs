import test from "node:test";
import assert from "node:assert/strict";

import {
  getFalUsageCostSummary,
  getFalUsageCredentials,
  getLocalDateString,
  summarizeFalUsageResponse,
} from "../lib/falUsageCost.mjs";

test("Fal usage credentials prefer FAL_ADMIN_KEY for usage APIs", () => {
  assert.equal(getFalUsageCredentials({ FAL_ADMIN_KEY: "admin", FAL_KEY: "normal", FAL_API_KEY: "fallback" }), "admin");
  assert.equal(getFalUsageCredentials({ FAL_KEY: "normal", FAL_API_KEY: "fallback" }), "normal");
  assert.equal(getFalUsageCredentials({ FAL_API_KEY: "fallback" }), "fallback");
});

test("Fal usage response summary totals cost by currency", () => {
  const summary = summarizeFalUsageResponse({
    time_series: [
      {
        bucket: "2026-06-14T00:00:00Z",
        results: [
          { endpoint_id: "fal-ai/model-a", unit: "second", quantity: 4, cost: 0.4, currency: "USD", auth_method: "Production Key" },
          { endpoint_id: "fal-ai/model-b", unit: "image", quantity: 2, cost: "0.6", currency: "USD", auth_method: "Production Key" },
        ],
      },
    ],
  });

  assert.equal(summary.cost, 1);
  assert.equal(summary.currency, "USD");
  assert.equal(summary.lineItemCount, 2);
  assert.equal(summary.totalQuantity, 6);
  assert.equal(summary.timeSeries[0].cost, 1);
  assert.equal(summary.endpointBreakdown.length, 2);
  assert.equal(summary.authMethodBreakdown[0].label, "Production Key");
});

test("local date string respects the configured dashboard timezone", () => {
  assert.equal(getLocalDateString(new Date("2026-06-13T21:30:00.000Z"), "Europe/Istanbul"), "2026-06-14");
});

test("Fal cost summary fetches real usage windows without mock values", async () => {
  const calledUrls = [];
  const fetchImpl = async (url, options) => {
    calledUrls.push({ url: String(url), authorization: options.headers.Authorization });
    if (String(url).includes("/account/billing")) {
      return {
        ok: true,
        async json() {
          return {
            username: "workspace",
            credits: { current_balance: 12.5, currency: "USD" },
          };
        },
      };
    }

    if (String(url).includes("/models/billing-events")) {
      return {
        ok: true,
        async json() {
          return {
            billing_events: [
              {
                request_id: "request_1",
                endpoint_id: "fal-ai/model-a",
                timestamp: "2026-06-14T09:00:00Z",
                output_units: 1,
                unit_price: 0.1,
                percent_discount: null,
                cost_estimate_nano_usd: 100000000,
              },
            ],
            next_cursor: null,
            has_more: false,
          };
        },
      };
    }

    return {
      ok: true,
      async json() {
        return {
          time_series: [
            {
              bucket: "2026-06-14T00:00:00Z",
              results: [{ endpoint_id: "fal-ai/model-a", unit: "second", quantity: 5, cost: 1.25, currency: "USD", auth_method: "normal-key" }],
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

  assert.equal(calledUrls.length, 6);
  assert.ok(calledUrls.every((call) => call.authorization === "Key normal-key"));
  assert.equal(summary.windows.allTime.cost, 1.25);
  assert.equal(summary.windows.last30Days.cost, 1.25);
  assert.equal(summary.windows.last7Days.cost, 1.25);
  assert.equal(summary.windows.today.cost, 1.25);
  assert.equal(summary.accountBilling.credits.currentBalance, 12.5);
  assert.equal(summary.recentBillingEvents[0].costEstimateUsd, 0.1);
});
