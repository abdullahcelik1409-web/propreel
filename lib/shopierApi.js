const SHOPIER_API_BASE_URL = "https://api.shopier.com/v1";

function getShopierApiToken() {
  return process.env.SHOPIER_API_TOKEN || process.env.SHOPIER_PAT || null;
}

function shopierApiError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

export function isShopierApiConfigured() {
  return Boolean(getShopierApiToken());
}

export async function shopierApiRequest(path, { method = "GET", body, searchParams } = {}) {
  const token = getShopierApiToken();
  if (!token) {
    throw shopierApiError("Shopier API token is not configured.", 500);
  }

  const url = new URL(path.replace(/^\//, ""), SHOPIER_API_BASE_URL.endsWith("/") ? SHOPIER_API_BASE_URL : `${SHOPIER_API_BASE_URL}/`);
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
    throw shopierApiError(`Shopier API request failed with ${response.status}.`, response.status, payload);
  }

  return payload;
}

export async function getShopierOrder(orderId) {
  if (!orderId) return null;
  return shopierApiRequest(`/orders/${encodeURIComponent(orderId)}`);
}

export async function listShopierOrders(searchParams) {
  return shopierApiRequest("/orders", { searchParams });
}

export async function createShopierWebhookSubscription({ event, url }) {
  return shopierApiRequest("/webhooks", {
    method: "POST",
    body: { event, url },
  });
}
