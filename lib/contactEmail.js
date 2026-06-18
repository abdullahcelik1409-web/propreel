import { SELLER_INFO, SITE_URL } from "./siteContent.js";

const SUPPORT_TOPICS = new Set(["Payment support", "Credit delivery", "Video generation", "Account access", "Refund request", "Other"]);

function normalizeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function truncate(value, maxLength) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function escapeHtml(value) {
  return normalizeString(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function validateContactMessage(input = {}) {
  const name = truncate(normalizeString(input.name), 80);
  const email = truncate(normalizeString(input.email).toLowerCase(), 160);
  const topicInput = normalizeString(input.topic);
  const topic = SUPPORT_TOPICS.has(topicInput) ? topicInput : "Other";
  const packageName = truncate(normalizeString(input.packageName), 120);
  const message = truncate(normalizeString(input.message), 3000);
  const website = normalizeString(input.website);

  const errors = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (message.length < 10) errors.message = "Enter at least 10 characters.";
  if (message.length > 3000) errors.message = "Message is too long.";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      email,
      topic,
      packageName,
      message,
      website,
    },
  };
}

export function buildContactEmailPayload(message, context = {}, env = process.env) {
  const to = env.CONTACT_EMAIL_TO || SELLER_INFO.email;
  const from = env.CONTACT_EMAIL_FROM || `Viseo Support <${SELLER_INFO.email}>`;
  const subject = `[Viseo Support] ${message.topic} - ${message.name}`;
  const submittedAt = new Date().toISOString();
  const pageUrl = context.pageUrl || `${SITE_URL}/contact`;
  const userAgent = context.userAgent || "unknown";

  const text = [
    `Topic: ${message.topic}`,
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    message.packageName ? `Package: ${message.packageName}` : null,
    `Submitted: ${submittedAt}`,
    `Page: ${pageUrl}`,
    `User-Agent: ${userAgent}`,
    "",
    "Message:",
    message.message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 16px">New Viseo support message</h2>
      <p><strong>Topic:</strong> ${escapeHtml(message.topic)}</p>
      <p><strong>Name:</strong> ${escapeHtml(message.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
      ${message.packageName ? `<p><strong>Package:</strong> ${escapeHtml(message.packageName)}</p>` : ""}
      <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
      <p><strong>Page:</strong> ${escapeHtml(pageUrl)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
      <p style="white-space:pre-wrap">${escapeHtml(message.message)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
      <p style="font-size:12px;color:#6b7280">User-Agent: ${escapeHtml(userAgent)}</p>
    </div>
  `;

  return {
    from,
    to,
    reply_to: message.email,
    subject,
    text,
    html,
  };
}

export async function sendContactEmail(message, context = {}, env = process.env, fetchImpl = fetch) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error("Contact email service is not configured.");
    error.status = 503;
    throw error;
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(buildContactEmailPayload(message, context, env)),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || "Contact email could not be sent.");
    error.status = response.status || 502;
    error.payload = payload;
    throw error;
  }

  return payload;
}
