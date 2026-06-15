const LEMON_SQUEEZY_API_BASE_URL = "https://api.lemonsqueezy.com/v1";

export function isLemonSqueezyApiConfigured(env = process.env) {
  return Boolean(env.LEMON_SQUEEZY_API_KEY && env.LEMON_SQUEEZY_STORE_ID);
}

function lemonSqueezyApiError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

export async function lemonSqueezyApiRequest(path, { method = "GET", body, searchParams, env = process.env } = {}) {
  const token = env.LEMON_SQUEEZY_API_KEY;
  if (!token) {
    throw lemonSqueezyApiError("Lemon Squeezy API key is not configured.", 500);
  }

  const url = new URL(path.replace(/^\//, ""), `${LEMON_SQUEEZY_API_BASE_URL}/`);
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
      accept: "application/vnd.api+json",
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/vnd.api+json" } : {}),
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
    throw lemonSqueezyApiError(`Lemon Squeezy API request failed with ${response.status}.`, response.status, payload);
  }

  return payload;
}

export async function createLemonSqueezyCheckout({ packageConfig, user, internalOrderId, appUrl }) {
  const baseUrl = String(appUrl || "").replace(/\/$/, "");
  const successUrl = baseUrl ? `${baseUrl}/payments/lemon-squeezy/success` : null;

  return lemonSqueezyApiRequest("/checkouts", {
    method: "POST",
    body: {
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            enabled_variants: [Number(packageConfig.lemonSqueezyVariantId)].filter(Number.isFinite),
            name: packageConfig.name,
            description: `${packageConfig.credits.toLocaleString("en-US")} Viseo credits for AI real estate video generation.`,
            ...(successUrl ? { redirect_url: successUrl } : {}),
            receipt_button_text: "Open Viseo",
            receipt_link_url: baseUrl || undefined,
          },
          checkout_options: {
            dark: true,
            logo: true,
            media: false,
            desc: true,
            discount: true,
            button_color: "#00fbfb",
          },
          checkout_data: {
            email: user.email || "",
            name: user.name || "",
            custom: {
              user_id: user.id,
              user_email: user.email,
              package_id: packageConfig.id,
              credits: packageConfig.credits,
              internal_order_id: internalOrderId,
              price_usd: packageConfig.priceUsd,
              currency: packageConfig.currency,
              billing_type: packageConfig.billingType,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(process.env.LEMON_SQUEEZY_STORE_ID),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(packageConfig.lemonSqueezyVariantId),
            },
          },
        },
      },
    },
  });
}
