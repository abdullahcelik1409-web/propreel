import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { CREDIT_PACKAGES, premiumVideoConfig } from "../lib/videoConfig.js";
import {
  LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS,
  LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS,
  POLAR_PRODUCT_ID_PACKAGE_ENV_KEYS,
  getCreditPackagesWithPaymentConfig,
  getPackageConfig,
} from "../lib/paymentConfig.js";
import { getActivePaymentProvider, getPaymentProviderConfig, paymentProviderConfig } from "../lib/payments/providerConfig.js";
import { polarAdapter, verifyPolarWebhookSignature } from "../lib/payments/providers/polar.js";

test("credit package ids, USD prices, and credit amounts remain configured", () => {
  assert.deepEqual(
    CREDIT_PACKAGES.map(({ id, name, credits, priceUsd, currency, billingType }) => ({
      id,
      name,
      credits,
      priceUsd,
      currency,
      billingType,
    })),
    [
      {
        id: "starter_credits",
        name: "Starter Credits",
        credits: 1200,
        priceUsd: 9,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "growth_credits",
        name: "Growth Credits",
        credits: 3000,
        priceUsd: 19,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "agency_credits",
        name: "Agency Credits",
        credits: 9000,
        priceUsd: 49,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "pro_credits_25000",
        name: "Pro Credits",
        credits: 25000,
        priceUsd: 149,
        currency: "USD",
        billingType: "one_time",
      },
      {
        id: "premium_credits_50000",
        name: "Premium Credits",
        credits: 50000,
        priceUsd: 299,
        currency: "USD",
        billingType: "one_time",
      },
    ],
  );
});

test("new premium credit packages match Ultra Cinematic capacity", () => {
  const pro = CREDIT_PACKAGES.find((pack) => pack.id === "pro_credits_25000");
  const premium = CREDIT_PACKAGES.find((pack) => pack.id === "premium_credits_50000");

  assert.equal(pro?.priceUsd, 149);
  assert.equal(pro?.credits, 25000);
  assert.equal(pro.credits / premiumVideoConfig.creditCost, 10);
  assert.equal(premium?.priceUsd, 299);
  assert.equal(premium?.credits, 50000);
  assert.equal(premium.credits / premiumVideoConfig.creditCost, 20);
});

test("Most Popular badge is assigned to the higher Pro package only", () => {
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "growth_credits")?.badge, undefined);
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "pro_credits_25000")?.badge, "Most Popular");
  assert.equal(CREDIT_PACKAGES.find((pack) => pack.id === "premium_credits_50000")?.badge, undefined);
});

test("Lemon Squeezy env keys follow the configured checkout and webhook mapping", () => {
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.pro_credits_25000, "LEMON_SQUEEZY_VARIANT_ID_PRO_CREDITS_25000");
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.premium_credits_50000, "LEMON_SQUEEZY_VARIANT_ID_PREMIUM_CREDITS_50000");
  assert.equal(LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS.pro_credits_25000, "LEMON_SQUEEZY_PRODUCT_ID_PRO_CREDITS_25000");
  assert.equal(LEMON_SQUEEZY_PRODUCT_ID_ENV_KEYS.premium_credits_50000, "LEMON_SQUEEZY_PRODUCT_ID_PREMIUM_CREDITS_50000");
  assert.equal(LEMON_SQUEEZY_VARIANT_ID_ENV_KEYS.starter_credits, "LEMON_SQUEEZY_VARIANT_ID_STARTER_CREDITS");
});

test("Polar package product aliases follow the configured package order", () => {
  assert.deepEqual(POLAR_PRODUCT_ID_PACKAGE_ENV_KEYS, {
    starter_credits: "POLAR_PRODUCT_ID_PACKAGE_1",
    growth_credits: "POLAR_PRODUCT_ID_PACKAGE_2",
    agency_credits: "POLAR_PRODUCT_ID_PACKAGE_3",
    pro_credits_25000: "POLAR_PRODUCT_ID_PACKAGE_4",
    premium_credits_50000: "POLAR_PRODUCT_ID_PACKAGE_5",
  });

  const env = {
    POLAR_PRODUCT_ID_PACKAGE_1: "prod_starter",
    POLAR_PRODUCT_ID_PACKAGE_2: "prod_growth",
    POLAR_PRODUCT_ID_PACKAGE_3: "prod_agency",
    POLAR_PRODUCT_ID_PACKAGE_4: "prod_pro",
    POLAR_PRODUCT_ID_PACKAGE_5: "prod_premium",
  };

  const packageConfig = getPackageConfig("starter_credits", "polar", env);
  assert.equal(packageConfig.providerProductId, "prod_starter");
  assert.equal(packageConfig.providerPriceId, null);
  assert.equal(packageConfig.variantIdConfigured, true);
});

test("payment provider defaults to Polar when PAYMENT_PROVIDER is not set", () => {
  assert.equal(getActivePaymentProvider({}), "polar");
});

test("payment package config resolves all packages for the active provider without trusting client prices", () => {
  const packages = getCreditPackagesWithPaymentConfig("paytr");
  assert.equal(packages.length, 5);
  assert.deepEqual(
    packages.map(({ id, priceUsd, currency, credits, active }) => ({ id, priceUsd, currency, credits, active })),
    CREDIT_PACKAGES.map(({ id, priceUsd, currency, credits }) => ({ id, priceUsd, currency, credits, active: true })),
  );
});

test("provider legal model changes payment copy", () => {
  assert.equal(getPaymentProviderConfig("lemon").legalModel, "merchant_of_record");
  assert.equal(getPaymentProviderConfig("polar").legalModel, "merchant_of_record");
  assert.equal(getPaymentProviderConfig("paytr").legalModel, "payment_processor");
  assert.match(paymentProviderConfig.paytr.pricingPaymentNote, /remains responsible for tax, invoicing, and refund handling/);
});

test("Polar webhook verification follows Standard Webhooks base64 signature", () => {
  const body = JSON.stringify({ type: "order.paid", data: { id: "ord_123", paid: true } });
  const webhookId = "evt_123";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const secret = Buffer.from("polar_test_secret").toString("base64");
  const signature = crypto.createHmac("sha256", Buffer.from(secret, "base64")).update(`${webhookId}.${timestamp}.${body}`, "utf8").digest("base64");
  const headers = new Headers({
    "webhook-id": webhookId,
    "webhook-timestamp": timestamp,
    "webhook-signature": `v1,${signature}`,
  });

  assert.equal(verifyPolarWebhookSignature(body, headers, secret), true);
});

test("Polar checkout session sends server-resolved product and metadata", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestInit = null;

  try {
    globalThis.fetch = async (url, init) => {
      requestUrl = String(url);
      requestInit = init;
      return new Response(JSON.stringify({ id: "chk_123", url: "https://polar.example/checkout/chk_123" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    };

    const result = await polarAdapter.createCheckout({
      packageConfig: {
        id: "starter_credits",
        name: "Starter Credits",
        credits: 1200,
        priceUsd: 9,
        currency: "USD",
        billingType: "one_time",
        providerProductId: "prod_starter",
        providerPriceId: null,
      },
      user: { id: "user_123", email: "buyer@example.com", name: "Buyer" },
      internalOrderId: "internal_123",
      successUrl: "https://viseo.example/payments/success",
      cancelUrl: "https://viseo.example/payments/cancel",
      env: {
        POLAR_ENVIRONMENT: "sandbox",
        POLAR_ACCESS_TOKEN: "polar_token",
      },
    });

    const body = JSON.parse(requestInit.body);
    assert.equal(requestUrl, "https://sandbox-api.polar.sh/v1/checkouts");
    assert.deepEqual(body.products, ["prod_starter"]);
    assert.equal(body.success_url, "https://viseo.example/payments/success");
    assert.equal(body.return_url, "https://viseo.example/payments/cancel");
    assert.equal(body.cancel_url, undefined);
    assert.equal(body.external_customer_id, "user_123");
    assert.equal(body.metadata.user_id, "user_123");
    assert.equal(body.metadata.package_id, "starter_credits");
    assert.equal(body.metadata.credits, 1200);
    assert.equal(body.metadata.internal_order_id, "internal_123");
    assert.equal(body.metadata.environment, "sandbox");
    assert.equal(result.checkoutUrl, "https://polar.example/checkout/chk_123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Polar adapter grants credits only for order.paid events", () => {
  const orderPaid = polarAdapter.parseWebhook(
    JSON.stringify({
      type: "order.paid",
      data: {
        id: "ord_123",
        paid: true,
        total_amount: 900,
        currency: "usd",
        product_id: "prod_starter",
        checkout_id: "chk_123",
        metadata: {
          user_id: "user_123",
          package_id: "starter_credits",
          internal_order_id: "internal_123",
        },
        customer: {
          external_id: "user_123",
          email: "buyer@example.com",
        },
      },
    }),
    new Headers({ "webhook-id": "evt_order_paid" }),
  );

  assert.equal(orderPaid.eventId, "evt_order_paid");
  assert.equal(orderPaid.status, "paid");
  assert.equal(orderPaid.amount, "9.00");
  assert.equal(orderPaid.userId, "user_123");
  assert.equal(orderPaid.packageId, "starter_credits");

  const orderCreated = polarAdapter.parseWebhook(
    JSON.stringify({
      type: "order.created",
      data: {
        id: "ord_124",
        paid: true,
        metadata: {
          user_id: "user_123",
          package_id: "starter_credits",
        },
      },
    }),
    new Headers({ "webhook-id": "evt_order_created" }),
  );

  assert.equal(orderCreated.status, "ignored");
});
