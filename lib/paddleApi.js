const PADDLE_API_VERSION = "1";

function normalizeEnvironment(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "production" || normalized === "live" ? "production" : "sandbox";
}

export function getPaddleEnvironment(env = process.env) {
  return normalizeEnvironment(env.PADDLE_ENVIRONMENT || env.NEXT_PUBLIC_PADDLE_ENVIRONMENT);
}

export function getPaddleApiBaseUrl(env = process.env) {
  return getPaddleEnvironment(env) === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export function isPaddleApiConfigured(env = process.env) {
  return Boolean(env.PADDLE_API_KEY);
}

function paddleApiError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

export async function paddleApiRequest(path, { method = "GET", body, searchParams, env = process.env } = {}) {
  const token = env.PADDLE_API_KEY;
  if (!token) {
    throw paddleApiError("Paddle API key is not configured.", 500);
  }

  const url = new URL(path.replace(/^\//, ""), `${getPaddleApiBaseUrl(env)}/`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "paddle-version": PADDLE_API_VERSION,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    throw paddleApiError(`Paddle API request failed with ${response.status}.`, response.status, payload);
  }

  return payload;
}

export async function createPaddleTransaction({ packageConfig, user, internalOrderId, appUrl }) {
  const checkoutUrl = appUrl ? `${String(appUrl).replace(/\/$/, "")}/payments/paddle/checkout` : null;

  return paddleApiRequest("/transactions", {
    method: "POST",
    body: {
      collection_mode: "automatic",
      currency_code: packageConfig.currency,
      items: [
        {
          price_id: packageConfig.paddlePriceId,
          quantity: 1,
        },
      ],
      custom_data: {
        user_id: user.id,
        user_email: user.email,
        package_id: packageConfig.id,
        credits: packageConfig.credits,
        internal_order_id: internalOrderId,
        environment: getPaddleEnvironment(),
        price_usd: packageConfig.priceUsd,
        currency: packageConfig.currency,
        billing_type: packageConfig.billingType,
      },
      checkout: checkoutUrl ? { url: checkoutUrl } : undefined,
    },
  });
}
