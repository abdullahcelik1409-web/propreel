# Lemon Squeezy Setup Guide

This project sells one-time digital credit packages for AI real estate video generation. Lemon Squeezy is the merchant of record for checkout, payment processing, tax handling, receipts, and supported payment methods.

## Package Mapping

| Package | Internal ID | Price | Currency | Credits | Lemon Squeezy Product ID env | Lemon Squeezy Variant ID env |
|---|---|---:|---|---:|---|---|
| Starter Credits | `starter_credits` | 9 | USD | 1,200 | `LEMON_SQUEEZY_PRODUCT_ID_STARTER_CREDITS` | `LEMON_SQUEEZY_VARIANT_ID_STARTER_CREDITS` |
| Growth Credits | `growth_credits` | 19 | USD | 3,000 | `LEMON_SQUEEZY_PRODUCT_ID_GROWTH_CREDITS` | `LEMON_SQUEEZY_VARIANT_ID_GROWTH_CREDITS` |
| Agency Credits | `agency_credits` | 49 | USD | 9,000 | `LEMON_SQUEEZY_PRODUCT_ID_AGENCY_CREDITS` | `LEMON_SQUEEZY_VARIANT_ID_AGENCY_CREDITS` |
| Pro Credits | `pro_credits_25000` | 149 | USD | 25,000 | `LEMON_SQUEEZY_PRODUCT_ID_PRO_CREDITS_25000` | `LEMON_SQUEEZY_VARIANT_ID_PRO_CREDITS_25000` |
| Premium Credits | `premium_credits_50000` | 299 | USD | 50,000 | `LEMON_SQUEEZY_PRODUCT_ID_PREMIUM_CREDITS_50000` | `LEMON_SQUEEZY_VARIANT_ID_PREMIUM_CREDITS_50000` |

Variant ID is the server-side fulfillment key. Credits are granted only when the signed Lemon Squeezy `order_created` webhook matches the expected package custom data and variant ID.

## Lemon Squeezy Dashboard Steps

1. Activate the Lemon Squeezy store and complete identity/store review.
2. Create one product or separate products for the credit packages.
3. Create one single-payment variant per credit package.
4. Set prices in USD: `9`, `19`, `49`, `149`, `299`.
5. Copy the store ID to `LEMON_SQUEEZY_STORE_ID`.
6. Create an API key and set `LEMON_SQUEEZY_API_KEY`.
7. Create a webhook in Settings > Webhooks:
   - URL: `https://your-domain.com/api/webhooks/lemon-squeezy`
   - Events: `order_created`, `order_refunded`
   - Signing secret: set the same value in `LEMON_SQUEEZY_WEBHOOK_SECRET`
8. Remove all legacy payment provider environment variables from local, preview, and production environments.

## Environment Variables

```bash
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com

LEMON_SQUEEZY_PRODUCT_ID_STARTER_CREDITS=
LEMON_SQUEEZY_VARIANT_ID_STARTER_CREDITS=
LEMON_SQUEEZY_PRODUCT_ID_GROWTH_CREDITS=
LEMON_SQUEEZY_VARIANT_ID_GROWTH_CREDITS=
LEMON_SQUEEZY_PRODUCT_ID_AGENCY_CREDITS=
LEMON_SQUEEZY_VARIANT_ID_AGENCY_CREDITS=
LEMON_SQUEEZY_PRODUCT_ID_PRO_CREDITS_25000=
LEMON_SQUEEZY_VARIANT_ID_PRO_CREDITS_25000=
LEMON_SQUEEZY_PRODUCT_ID_PREMIUM_CREDITS_50000=
LEMON_SQUEEZY_VARIANT_ID_PREMIUM_CREDITS_50000=
```

`LEMON_SQUEEZY_API_KEY` and `LEMON_SQUEEZY_WEBHOOK_SECRET` must remain server-side only.

## Flow

1. The user selects a credit package from pricing or credits.
2. The client sends only `packageId`.
3. `/api/payments/lemon-squeezy/checkout` validates the authenticated user.
4. The server resolves package price, credits, product ID, and variant ID.
5. The server creates a Lemon Squeezy checkout and passes custom data: `user_id`, `user_email`, `package_id`, `credits`, `internal_order_id`, `price_usd`, `currency`, `billing_type`.
6. The user is redirected to Lemon Squeezy hosted checkout.
7. Credits are delivered only from `/api/webhooks/lemon-squeezy` after a valid `X-Signature` and `order_created` event.
8. Duplicate webhook or duplicate order delivery is blocked by `LemonSqueezyWebhookEvent.eventId` and `PaymentOrder.creditedAt`.

## Application Checklist

- [ ] Public pricing page is available.
- [ ] Public terms page is available.
- [ ] Public privacy page is available.
- [ ] Public refund policy is available.
- [ ] Contact/support page shows seller email, phone, and address.
- [ ] The website clearly describes digital credits and AI real estate video generation.
- [ ] Prices are shown before checkout in USD.
- [ ] The refund policy explains unused credits and used digital service credits.
- [ ] Legacy payment provider names are not visible in active UI, legal pages, env examples, or docs.
- [ ] Lemon Squeezy product and variant IDs are configured in production env.
- [ ] Webhook URL is configured for `order_created` and `order_refunded`.
- [ ] A test purchase grants credits once.
- [ ] A duplicate webhook does not grant credits twice.
