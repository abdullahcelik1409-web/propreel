import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { verifyLemonSqueezySignature } from "../lib/lemonSqueezyWebhook.js";

test("Lemon Squeezy webhook signature verifies signed raw body", () => {
  const rawBody = JSON.stringify({ meta: { event_name: "order_created" }, data: { id: "ord_test" } });
  const secret = "test_secret";
  const signature = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  assert.equal(verifyLemonSqueezySignature(rawBody, signature, secret), true);
  assert.equal(verifyLemonSqueezySignature(rawBody, "bad", secret), false);
});
