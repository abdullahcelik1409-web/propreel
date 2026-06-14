import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { verifyPaddleSignature } from "../lib/paddleWebhook.js";

test("Paddle webhook signature verifies signed raw body", () => {
  const rawBody = JSON.stringify({ event_id: "evt_test", event_type: "transaction.completed" });
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "test_secret";
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}:${rawBody}`, "utf8").digest("hex");

  assert.equal(verifyPaddleSignature(rawBody, `ts=${timestamp};h1=${signature}`, secret), true);
  assert.equal(verifyPaddleSignature(rawBody, `ts=${timestamp};h1=bad`, secret), false);
});
