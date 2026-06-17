# Payment Provider Setup Guide

Viseo sells one-time digital credit packages for AI real estate video generation. The active payment provider is selected with `PAYMENT_PROVIDER=lemon|polar|paytr`.

## Architecture

- `lib/payments/providerConfig.js` defines provider legal model and UI/legal copy.
- `lib/payments/packageConfig.js` maps the existing five credit packages to USD prices and provider product/price IDs.
- `lib/payments/paymentService.js` owns checkout creation, webhook processing, idempotency, payment records, and credit fulfillment.
- Provider adapters live in `lib/payments/providers/`.
- Checkout route: `/api/payments/checkout`.
- Central webhook route: `/api/webhooks/payment?provider=<provider>`.
- Provider-specific webhook routes: `/api/webhooks/lemon-squeezy`, `/api/webhooks/polar`, `/api/webhooks/paytr`.

## Package Mapping

| Package | Internal ID | Price | Currency | Credits |
|---|---|---:|---|---:|
| Starter Credits | `starter_credits` | 9 | USD | 1,200 |
| Growth Credits | `growth_credits` | 19 | USD | 3,000 |
| Agency Credits | `agency_credits` | 49 | USD | 9,000 |
| Pro Credits | `pro_credits_25000` | 149 | USD | 25,000 |
| Premium Credits | `premium_credits_50000` | 299 | USD | 50,000 |

The client sends only `packageId`. Price, currency, credits, and provider product/price IDs are resolved on the server.

## Environment Variables

```bash
PAYMENT_PROVIDER=lemon
NEXT_PUBLIC_APP_URL=https://your-domain.com

LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
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

POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_ORGANIZATION_ID=
POLAR_PRODUCT_ID_STARTER_CREDITS=
POLAR_PRICE_ID_STARTER_CREDITS=
POLAR_PRODUCT_ID_GROWTH_CREDITS=
POLAR_PRICE_ID_GROWTH_CREDITS=
POLAR_PRODUCT_ID_AGENCY_CREDITS=
POLAR_PRICE_ID_AGENCY_CREDITS=
POLAR_PRODUCT_ID_PRO_CREDITS_25000=
POLAR_PRICE_ID_PRO_CREDITS_25000=
POLAR_PRODUCT_ID_PREMIUM_CREDITS_50000=
POLAR_PRICE_ID_PREMIUM_CREDITS_50000=

PAYTR_MERCHANT_ID=
PAYTR_MERCHANT_KEY=
PAYTR_MERCHANT_SALT=
PAYTR_TEST_MODE=0
```

Only `NEXT_PUBLIC_*` values may be exposed to the frontend. Provider API keys and webhook secrets must stay server-side.

## Provider Notes

Lemon Squeezy:
- Legal model: Merchant of Record.
- Configure one-time variants for each package.
- Webhook events: `order_created`, `order_refunded`.
- Signature header: `X-Signature`.

Polar:
- Legal model: Merchant of Record.
- Configure products/prices for each package.
- Keep Viseo credit delivery in `User.credits` + `CreditEvent`; do not grant credits twice through Polar benefits and Viseo ledger.

PayTR:
- Legal model: payment processor.
- Viseo remains responsible for seller, tax, invoice, and refund obligations.
- Configure merchant credentials and callback URL.

## Fulfillment Flow

1. User selects a credit package.
2. Client posts `{ packageId }` to `/api/payments/checkout`.
3. Server authenticates the user and resolves package config.
4. Active adapter creates checkout.
5. Server stores a `PaymentOrder` with `checkout_created`.
6. Provider sends a signed webhook.
7. `paymentService` verifies signature before parsing fulfillment data.
8. `PaymentWebhookEvent(provider,eventId)` blocks duplicate events.
9. `PaymentOrder(provider,providerOrderId)` and `PaymentOrder.creditedAt` block duplicate credit grants.
10. Successful paid events increment `User.credits` and create a `CreditEvent`.

## Legal Copy

Legal, pricing, footer, refund, and privacy text comes from `paymentProviderConfig`.

- Lemon and Polar use `merchant_of_record` copy.
- PayTR uses `payment_processor` copy and does not show Merchant of Record language.

## Production Checklist

- [ ] Supabase tables checked; duplicate payment/credit tables were not created.
- [ ] `PaymentOrder` uses provider-scoped idempotency.
- [ ] `PaymentWebhookEvent` exists with unique `(provider,eventId)`.
- [ ] `CreditEvent` and `User.credits` are the active credit ledger/balance model.
- [ ] RLS is enabled for payment/webhook/credit tables.
- [ ] `PAYMENT_PROVIDER` is correct.
- [ ] Active provider env values are configured.
- [ ] Package prices are USD: `9`, `19`, `49`, `149`, `299`.
- [ ] Provider product/price IDs match the active dashboard.
- [ ] Checkout tested.
- [ ] Webhook signature tested.
- [ ] Duplicate webhook tested.
- [ ] Credit delivery tested.
- [ ] Terms, Privacy, Refund Policy, Contact, Pricing, and Footer reviewed for the active provider.
- [ ] Build/tests pass.
