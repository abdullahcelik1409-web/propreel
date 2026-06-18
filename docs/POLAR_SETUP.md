# Polar Odeme Kurulum Rehberi

Viseo odeme altyapisinin aktif provider'i Polar'dir. Uygulama tek providera kilitli degildir; `lemon` ve `paytr` adapterlari korunur, ancak varsayilan ve dokumante edilen akit Polar'dir.

## Resmi Dokuman Kontrolu

- Checkout Session API: `POST /v1/checkouts`, body icinde `products`, `metadata`, `external_customer_id`, `success_url`, `return_url`.
- Webhook: Polar Standard Webhooks kullanir; endpoint raw JSON body ile imza dogrulamalidir.
- Kredi yukleme eventi: `order.paid`. Polar bu event icin odemenin islendigi ve paranin alindigi bilgisini verir.
- Sandbox: `https://sandbox-api.polar.sh/v1`, dashboard `sandbox.polar.sh`, test karti `4242 4242 4242 4242`.
- Production: `https://api.polar.sh/v1`.
- Merchant of Record: Polar dijital satislarda MoR olabilir; satis vergisi ve checkout kayitlarini Polar yonetebilir. Viseo gelir vergisi, muhasebe ve musteri destegi sorumluluklarini ayri degerlendirmelidir.
- Credits Benefit / Meter Credits: Polar tarafinda opsiyonel bir alternatif olarak vardir, fakat Viseo icin kaynak dogruluk Supabase `User.credits` + `CreditEvent` ledger'idir.

## Paket Eslesmesi

Client yalnizca `packageId` gonderir. Fiyat, kredi, currency ve Polar product ID sunucuda cozulur.

| Sira | Package | Internal ID | Price | Currency | Credits | Polar env |
|---:|---|---|---:|---|---:|---|
| 1 | Starter Credits | `starter_credits` | 9 | USD | 1,200 | `POLAR_PRODUCT_ID_PACKAGE_1` |
| 2 | Growth Credits | `growth_credits` | 19 | USD | 3,000 | `POLAR_PRODUCT_ID_PACKAGE_2` |
| 3 | Agency Credits | `agency_credits` | 49 | USD | 9,000 | `POLAR_PRODUCT_ID_PACKAGE_3` |
| 4 | Pro Credits | `pro_credits_25000` | 149 | USD | 25,000 | `POLAR_PRODUCT_ID_PACKAGE_4` |
| 5 | Premium Credits | `premium_credits_50000` | 299 | USD | 50,000 | `POLAR_PRODUCT_ID_PACKAGE_5` |

Eski acik isimli env anahtarlari da desteklenir: `POLAR_PRODUCT_ID_STARTER_CREDITS`, `POLAR_PRODUCT_ID_GROWTH_CREDITS`, `POLAR_PRODUCT_ID_AGENCY_CREDITS`, `POLAR_PRODUCT_ID_PRO_CREDITS_25000`, `POLAR_PRODUCT_ID_PREMIUM_CREDITS_50000`.

Polar Checkout API urun ID listesi bekledigi icin price ID zorunlu degildir. `POLAR_PRICE_ID_PACKAGE_1..5` ve acik isimli price ID anahtarlari opsiyonel olarak kayit/denetim amaciyla saklanabilir.

## Ortam Degiskenleri

Sandbox:

```bash
PAYMENT_PROVIDER=polar
POLAR_ENVIRONMENT=sandbox
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_PACKAGE_1=
POLAR_PRODUCT_ID_PACKAGE_2=
POLAR_PRODUCT_ID_PACKAGE_3=
POLAR_PRODUCT_ID_PACKAGE_4=
POLAR_PRODUCT_ID_PACKAGE_5=
NEXT_PUBLIC_APP_URL=https://your-preview-domain.vercel.app
```

Production:

```bash
PAYMENT_PROVIDER=polar
POLAR_ENVIRONMENT=production
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_PACKAGE_1=
POLAR_PRODUCT_ID_PACKAGE_2=
POLAR_PRODUCT_ID_PACKAGE_3=
POLAR_PRODUCT_ID_PACKAGE_4=
POLAR_PRODUCT_ID_PACKAGE_5=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

`POLAR_ACCESS_TOKEN` ve `POLAR_WEBHOOK_SECRET` sunucu sirridir; `NEXT_PUBLIC_` prefix'i ile yayinlanmamalidir.

## Checkout Akisi

1. Kullanici pricing sayfasindan paket secer.
2. Frontend `/api/payments/checkout` endpointine yalnizca `{ "packageId": "starter_credits" }` gonderir.
3. Sunucu session kullanicisini dogrular.
4. Sunucu paketi `CREDIT_PACKAGES` uzerinden bulur ve Polar product ID ile eslestirir.
5. Polar Checkout Session olusturulur:
   - `products`: secilen Polar product ID
   - `external_customer_id`: Supabase `User.id`
   - `success_url`: `/payments/success`
   - `return_url`: `/payments/cancel`
   - `metadata`: `user_id`, `package_id`, `credits`, `internal_order_id`, `price_usd`, `currency`, `environment`
6. Viseo `PaymentOrder` kaydini `checkout_created` olarak saklar.
7. Kullanici Polar hosted checkout URL'ine yonlendirilir.

## Webhook Akisi

Endpoint: `/api/webhooks/polar`

1. Route raw request body okur.
2. `webhook-id`, `webhook-timestamp`, `webhook-signature` headerlari Standard Webhooks mantigiyla dogrulanir.
3. Imza gecersizse islem durur.
4. Event `PaymentWebhookEvent(provider,eventId)` tablosuna yazilir. Unique `(provider,eventId)` duplicate eventleri engeller.
5. Sadece `order.paid` ve `data.paid === true` kredi yukleme icin kabul edilir.
6. Metadata icinden `user_id`, `package_id`, `internal_order_id` okunur. Gerekirse `customer.external_id` kullanici ID fallback'i olur.
7. Paket fiyat/currency/product ID server tarafinda beklenen degerlerle karsilastirilir.
8. `PaymentOrder(provider,providerOrderId)` ve `PaymentOrder.creditedAt` ikinci kez kredi verilmesini engeller.
9. Basarili odemede `User.credits` artirilir ve `CreditEvent` olusturulur.

`order.created`, `checkout.updated` veya subscription eventleri kredi yuklemez. Bunun sebebi Polar `order.paid` eventinin odemenin tamamen islendigi ve paranin alindigi anlama gelmesidir.

## Customer Portal

Opsiyonel endpoint: `/api/payments/polar/customer-portal`

Auth gerektirir ve Polar `POST /v1/customer-sessions` API'sini `external_customer_id = User.id` ile cagirir. Donen `customer_portal_url` frontend tarafinda kullanilabilir.

## Supabase Bulgulari

Canli DB'de beklenen tablolar:

- `User`: kredi bakiyesi `credits`
- `CreditEvent`: kredi ledger'i
- `PaymentOrder`: provider checkout/order kaydi
- `PaymentWebhookEvent`: provider-scoped webhook idempotency
- `LemonSqueezyWebhookEvent`: eski provider uyumlulugu icin durur

Beklenen guvenlik/idempotency:

- `PaymentWebhookEvent(provider,eventId)` unique
- `PaymentOrder(provider,providerOrderId)` unique
- `PaymentOrder.creditedAt` null degilse tekrar kredi verilmez
- RLS acik, public policy yok

## Polar Dashboard Adimlari

1. Sandbox organizasyonunda bes adet one-time digital product olustur.
2. Product fiyatlarini USD olarak `9`, `19`, `49`, `149`, `299` ayarla.
3. Product ID'leri sirayla `POLAR_PRODUCT_ID_PACKAGE_1..5` env anahtarlarina yaz.
4. Organization Access Token olustur ve `POLAR_ACCESS_TOKEN` olarak kaydet.
5. Webhook endpoint ekle: `https://your-domain.com/api/webhooks/polar`.
6. En az `order.paid` ve `order.refunded` eventlerini sec.
7. Webhook secret'i `POLAR_WEBHOOK_SECRET` olarak kaydet.
8. Sandbox checkout testini `4242 4242 4242 4242` karti ile yap.
9. `PaymentWebhookEvent`, `PaymentOrder`, `User.credits`, `CreditEvent` kayitlarini kontrol et.
10. Production'a gecmeden once account review, KYC, payout account, support yanit sureci ve chargeback riskini tamamla.

## MoR, Ucret ve Payout Notlari

- Polar Merchant of Record modelinde uluslararasi satis vergisi ve checkout kayitlarinin bir bolumunu yonetebilir.
- Polar plan/ucretleri dashboard ve guncel resmi fiyat sayfasindan teyit edilmelidir.
- Ilk payout oncesinde account review, KYC ve payout account kurulumu gerekir.
- Musteri destek sorumlulugu Viseo tarafinda kalir; Polar incelemelerinde destek yanit sureleri onemlidir.

## Production Checklist

- [ ] `PAYMENT_PROVIDER=polar`
- [ ] `POLAR_ENVIRONMENT=production`
- [ ] Production `POLAR_ACCESS_TOKEN` ayarlandi.
- [ ] Production `POLAR_WEBHOOK_SECRET` ayarlandi.
- [ ] Bes Polar product ID env'e girildi.
- [ ] Product fiyatlari Viseo paketleriyle birebir uyumlu.
- [ ] `/api/payments/checkout` yalnizca `packageId` kabul ediyor.
- [ ] `/api/webhooks/polar` raw body ve Standard Webhooks imzasi dogruluyor.
- [ ] Sadece `order.paid` kredi yukluyor.
- [ ] Duplicate webhook tekrar kredi yuklemiyor.
- [ ] Supabase migration uygulandi.
- [ ] Legal, pricing, contact, footer ve README Polar'i gosteriyor.
- [ ] Test, Prisma validate ve build basarili.
