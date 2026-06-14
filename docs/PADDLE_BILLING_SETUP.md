# Paddle Billing Kurulum Rehberi

Bu proje kredi paketlerini tek seferlik dijital kullanım hakkı olarak satar. Paket isimleri ve kredi miktarları uygulamadaki mevcut config'ten gelir; fiyat ve ödeme provider Paddle Billing'dir.

## Paket Eşleştirmesi

| Mevcut Paket Adı | Internal ID | Fiyat | Para Birimi | Kredi | Paddle Product ID | Paddle Price ID env |
|---|---|---:|---|---:|---|---|
| Starter Credits | `starter_credits` | 9 | USD | 1,200 | Dashboard'dan doldur | `PADDLE_PRICE_ID_STARTER_CREDITS` |
| Growth Credits | `growth_credits` | 19 | USD | 3,000 | Dashboard'dan doldur | `PADDLE_PRICE_ID_GROWTH_CREDITS` |
| Agency Credits | `agency_credits` | 49 | USD | 9,000 | Dashboard'dan doldur | `PADDLE_PRICE_ID_AGENCY_CREDITS` |
| Pro Credits | `pro_credits_25000` | 149 | USD | 25,000 | Dashboard'dan doldur | `PADDLE_PRICE_ID_PRO_CREDITS_25000` |
| Premium Credits | `premium_credits_50000` | 299 | USD | 50,000 | Dashboard'dan doldur | `PADDLE_PRICE_ID_PREMIUM_CREDITS_50000` |

Product ID env isimleri aynı sırayla `PADDLE_PRODUCT_ID_*` formatındadır. Product ID webhook doğrulama/log için tutulur; kredi yükleme kararında server-side `packageId -> Paddle priceId -> credits` mapping'i esas alınır.

## Paddle Dashboard Adımları

1. Sandbox hesabıyla başlayın; canlı satış için Paddle account/domain approval gerekir.
2. Her paket için Paddle Catalog altında one-time price oluşturun.
3. Fiyatları USD olarak girin: `9`, `19`, `49`, `149`, `299`.
4. Her price ID değerini ilgili `PADDLE_PRICE_ID_*` env değişkenine yazın.
5. Developer Tools > Authentication bölümünden server API key alın ve `PADDLE_API_KEY` olarak ekleyin.
6. Client-side token oluşturun ve `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` olarak ekleyin.
7. Notification destination oluşturun:
   - URL: `https://your-domain.com/api/webhooks/paddle`
   - Eventler: `transaction.completed`, `transaction.paid`, `transaction.canceled`, `transaction.past_due`, `transaction.payment_failed`, `adjustment.created`, `adjustment.updated`
8. Webhook secret değerini `PADDLE_WEBHOOK_SECRET` olarak ekleyin.

## Env Değişkenleri

```bash
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_APP_URL=https://your-domain.com

PADDLE_PRODUCT_ID_STARTER_CREDITS=
PADDLE_PRICE_ID_STARTER_CREDITS=
PADDLE_PRODUCT_ID_GROWTH_CREDITS=
PADDLE_PRICE_ID_GROWTH_CREDITS=
PADDLE_PRODUCT_ID_AGENCY_CREDITS=
PADDLE_PRICE_ID_AGENCY_CREDITS=
PADDLE_PRODUCT_ID_PRO_CREDITS_25000=
PADDLE_PRICE_ID_PRO_CREDITS_25000=
PADDLE_PRODUCT_ID_PREMIUM_CREDITS_50000=
PADDLE_PRICE_ID_PREMIUM_CREDITS_50000=
```

`PADDLE_API_KEY` ve `PADDLE_WEBHOOK_SECRET` sadece server tarafında kalmalıdır. Frontend tarafında yalnızca `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` kullanılabilir.

Local, preview ve production env alanlarında eski ödeme sağlayıcı değişkenleri tutulmamalıdır. Deploy öncesi Vercel environment variables, `.env.local` ve benzeri dosyalar sadece Paddle Billing anahtarlarını ve mevcut uygulama değişkenlerini içermelidir.

## Akış

1. Kullanıcı pricing veya credits sayfasında paket seçer.
2. Client sadece `packageId` gönderir.
3. `/api/payments/paddle/checkout` authenticated kullanıcıyı doğrular.
4. Server paket config'inden price ID, fiyat, currency ve kredi miktarını çözer.
5. Paddle transaction oluşturulur; `custom_data` içine `user_id`, `package_id`, `credits`, `internal_order_id`, `environment`, `price_usd`, `currency` yazılır.
6. Paddle Checkout açılır.
7. Kredi yükleme sadece `/api/webhooks/paddle` endpoint'ine gelen doğrulanmış `transaction.completed` event'iyle yapılır.
8. Aynı event veya aynı transaction tekrar gelirse `PaddleWebhookEvent.eventId` ve `PaymentOrder.creditedAt` nedeniyle kredi ikinci kez yüklenmez.

## Lokal Test Planı

- `npm run prisma:validate`
- `node --test tests/*.mjs`
- `npm run build`
- Paddle sandbox price ID'leriyle test checkout başlatma
- Geçersiz webhook imzasının `401` dönmesi
- Aynı `event_id` tekrar gönderildiğinde duplicate event olarak işlenmesi
- Aynı `transaction.id` tekrar geldiğinde `creditedAt` dolu olduğu için kredi tekrar yüklenmemesi
- Unknown package ID ve mismatched price ID durumlarının failed/unresolved loglanması

## Production Checklist

- [ ] Domain Paddle'da approved
- [ ] Terms sayfası yayında
- [ ] Privacy sayfası yayında
- [ ] Refund Policy yayında
- [ ] Contact/Support sayfası yayında
- [ ] Pricing sayfası net
- [ ] Tüm fiyatlar USD
- [ ] Paket fiyatları 9 / 19 / 49 / 149 / 299 USD
- [ ] Paddle products/prices production'da oluşturuldu
- [ ] Production price ID'leri env'e girildi
- [ ] Webhook destination production URL'ye bağlı
- [ ] Webhook secret production env'de
- [ ] `PADDLE_ENVIRONMENT=production`
- [ ] API key server env'de
- [ ] Client token frontend env'de
- [ ] Eski ödeme sağlayıcı env değişkenleri local/preview/production ortamlarından kaldırıldı
- [ ] Test ödeme yapıldı
- [ ] Webhook geldi
- [ ] Kredi yüklendi
- [ ] Duplicate webhook kredi tekrar yüklemedi
- [ ] Eski ödeme route'ları kapalı
- [ ] Footer legal linkleri çalışıyor
