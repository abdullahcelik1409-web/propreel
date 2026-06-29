import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import {
  buildDemoUrl,
  buildSignupUrl,
  getDemoVideos,
  pickDemoTrackingParams,
  sanitizeDemoEventPayload,
} from "../lib/marketing/demoConfig.js";

test("buildDemoUrl creates the expected outbound demo URL", () => {
  const url = buildDemoUrl({
    source: "cold_email",
    medium: "outbound",
    campaign: "realtors_us_demo",
    content: "standard_demo",
  });
  assert.equal(
    url,
    "https://getviseo.com/demo?utm_source=cold_email&utm_medium=outbound&utm_campaign=realtors_us_demo&utm_content=standard_demo",
  );
});

test("buildSignupUrl carries demo tracking params to the register route", () => {
  const url = buildSignupUrl({
    utm_source: "cold_email",
    utm_medium: "outbound",
    utm_campaign: "realtors_us_demo",
    utm_content: "luxury_demo",
    rid: "lead_42",
  });
  assert.equal(
    url,
    "/auth/register?utm_source=cold_email&utm_medium=outbound&utm_campaign=realtors_us_demo&utm_content=luxury_demo&rid=lead_42",
  );
});

test("pickDemoTrackingParams keeps only allowed query keys", () => {
  const params = pickDemoTrackingParams({
    utm_source: "cold_email",
    utm_medium: "outbound",
    ignored: "value",
  });
  assert.deepEqual(params, {
    utm_source: "cold_email",
    utm_medium: "outbound",
  });
});

test("sanitizeDemoEventPayload rejects invalid event names", () => {
  const result = sanitizeDemoEventPayload({ event_name: "bad_event" }, { userAgent: "UA" });
  assert.equal(result.error, "Invalid event_name");
  assert.equal(result.data, null);
});

test("sanitizeDemoEventPayload trims long strings and keeps allowed fields", () => {
  const result = sanitizeDemoEventPayload({
    session_id: "session_1",
    event_name: "demo_video_play",
    demo_id: "standard_listing",
    utm_campaign: "x".repeat(200),
    page_path: "/demo",
    unexpected: "ignore-me",
  }, {
    userAgent: "UA",
    referrer: "https://example.com/",
  });

  assert.equal(result.error, null);
  assert.equal(result.data.sessionId, "session_1");
  assert.equal(result.data.eventName, "demo_video_play");
  assert.equal(result.data.demoId, "standard_listing");
  assert.equal(result.data.utmCampaign.length, 160);
  assert.equal(result.data.userAgent, "UA");
});

test("getDemoVideos builds public storage URLs from the configured paths", () => {
  const videos = getDemoVideos({ supabaseUrl: "https://demo.supabase.co" });
  assert.equal(videos[0].videoUrl, "https://demo.supabase.co/storage/v1/object/public/media/marketing/demo/demo-standard.mp4");
  assert.equal(videos[1].videoUrl, "https://demo.supabase.co/storage/v1/object/public/media/marketing/demo/demo-luxury.mp4");
  assert.equal(videos[2].videoUrl, "https://demo.supabase.co/storage/v1/object/public/media/marketing/demo/demo-before-after.mp4");
});

test("generate-demo-links script prints the four expected example URLs", async () => {
  const output = await new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/generate-demo-links.mjs"], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `script exited with code ${code}`));
    });
  });

  const lines = output.split(/\r?\n/).filter(Boolean);
  assert.deepEqual(lines, [
    "https://getviseo.com/demo?utm_source=cold_email&utm_medium=outbound&utm_campaign=realtors_us_demo&utm_content=standard_demo",
    "https://getviseo.com/demo?utm_source=cold_email&utm_medium=outbound&utm_campaign=realtors_us_demo&utm_content=luxury_demo",
    "https://getviseo.com/demo?utm_source=cold_email&utm_medium=outbound&utm_campaign=photographers_partner_demo&utm_content=partner_demo",
    "https://getviseo.com/demo?utm_source=cold_email&utm_medium=outbound&utm_campaign=brokers_demo&utm_content=broker_demo",
  ]);
});
