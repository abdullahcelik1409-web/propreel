const ADMIN_CREDIT_RATE_LIMIT_WINDOW_MS = 60_000;
const ADMIN_CREDIT_RATE_LIMIT_MAX = 10;
export const ADMIN_CREDIT_AMOUNT_MIN = 1;
export const ADMIN_CREDIT_AMOUNT_MAX = 10_000;

const rateLimitBuckets = globalThis.__propreelAdminRateLimitBuckets || new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis.__propreelAdminRateLimitBuckets = rateLimitBuckets;
}

function createHttpError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload || { error: message };
  return error;
}

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request) {
  const origins = new Set();
  const requestOrigin = normalizeOrigin(request.url);
  const nextAuthOrigin = normalizeOrigin(process.env.NEXTAUTH_URL);
  const vercelOrigin = process.env.VERCEL_URL ? normalizeOrigin(`https://${process.env.VERCEL_URL}`) : null;

  if (requestOrigin) origins.add(requestOrigin);
  if (nextAuthOrigin) origins.add(nextAuthOrigin);
  if (vercelOrigin) origins.add(vercelOrigin);

  return origins;
}

export function assertSameOriginAdminRequest(request) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  const allowedOrigins = getAllowedOrigins(request);

  if (!origin || !allowedOrigins.has(origin)) {
    throw createHttpError("Admin request origin is not allowed.", 403);
  }
}

export function assertAdminCreditRateLimit(adminId) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(adminId);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(adminId, { count: 1, resetAt: now + ADMIN_CREDIT_RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (bucket.count >= ADMIN_CREDIT_RATE_LIMIT_MAX) {
    throw createHttpError("Too many admin credit updates. Try again shortly.", 429);
  }

  bucket.count += 1;
}

export function parseAdminCreditAmount(value) {
  const amount = Number.parseInt(value, 10);
  if (!Number.isInteger(amount)) return null;
  if (amount < ADMIN_CREDIT_AMOUNT_MIN || amount > ADMIN_CREDIT_AMOUNT_MAX) return null;
  return amount;
}

export function validateAdminCreditEmail(value) {
  const email = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function adminCreditValidationMessage() {
  return `Email and a credit amount between ${ADMIN_CREDIT_AMOUNT_MIN} and ${ADMIN_CREDIT_AMOUNT_MAX} are required.`;
}
