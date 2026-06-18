import test from "node:test";
import assert from "node:assert/strict";
import { buildContactEmailPayload, sendContactEmail, validateContactMessage } from "../lib/contactEmail.js";

test("contact message validation accepts support form input", () => {
  const result = validateContactMessage({
    name: "Buyer",
    email: "buyer@example.com",
    topic: "Payment support",
    packageName: "Starter Credits",
    message: "I need help with my checkout.",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.email, "buyer@example.com");
  assert.equal(result.data.topic, "Payment support");
});

test("contact message validation rejects invalid email and short messages", () => {
  const result = validateContactMessage({
    name: "A",
    email: "not-an-email",
    message: "short",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.name, "Enter your name.");
  assert.equal(result.errors.email, "Enter a valid email address.");
  assert.equal(result.errors.message, "Enter at least 10 characters.");
});

test("contact email payload targets support mailbox and preserves reply-to", () => {
  const message = validateContactMessage({
    name: "Buyer",
    email: "buyer@example.com",
    topic: "Refund request",
    packageName: "Growth Credits",
    message: "Please check my refund request for unused credits.",
  }).data;

  const payload = buildContactEmailPayload(
    message,
    { pageUrl: "https://getviseo.com/contact", userAgent: "test-agent" },
    {
      CONTACT_EMAIL_TO: "support@getviseo.com",
      CONTACT_EMAIL_FROM: "Viseo Support <support@getviseo.com>",
    },
  );

  assert.equal(payload.to, "support@getviseo.com");
  assert.equal(payload.from, "Viseo Support <support@getviseo.com>");
  assert.equal(payload.reply_to, "buyer@example.com");
  assert.match(payload.subject, /Refund request/);
  assert.match(payload.text, /Growth Credits/);
  assert.match(payload.html, /New Viseo support message/);
});

test("sendContactEmail posts to Resend API without exposing client credentials", async () => {
  const message = validateContactMessage({
    name: "Buyer",
    email: "buyer@example.com",
    topic: "Credit delivery",
    message: "My credits have not arrived after payment.",
  }).data;

  const calls = [];
  const result = await sendContactEmail(
    message,
    { pageUrl: "https://getviseo.com/contact", userAgent: "test-agent" },
    {
      RESEND_API_KEY: "re_test",
      CONTACT_EMAIL_TO: "support@getviseo.com",
      CONTACT_EMAIL_FROM: "Viseo Support <support@getviseo.com>",
    },
    async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200, headers: { "content-type": "application/json" } });
    },
  );

  assert.equal(result.id, "email_123");
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].init.headers.authorization, "Bearer re_test");
});
