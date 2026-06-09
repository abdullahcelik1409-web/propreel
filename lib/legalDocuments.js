import { LEGAL_LAST_UPDATED, PRODUCT_SUMMARY, SELLER_INFO, SITE_URL } from "./siteContent";

const sellerEn = `${SELLER_INFO.displayName}, ${SELLER_INFO.address}, phone ${SELLER_INFO.phone}, email ${SELLER_INFO.email}`;
const sellerTr = `${SELLER_INFO.displayName}, ${SELLER_INFO.address}, telefon ${SELLER_INFO.phone}, e-posta ${SELLER_INFO.email}`;

export const legalDocuments = {
  privacyPolicy: {
    lastUpdated: LEGAL_LAST_UPDATED,
    en: {
      title: "Privacy Policy",
      sections: [
        {
          heading: "Data controller and contact",
          body: [
            `The seller and data controller for PropReel is ${sellerEn}. This policy explains how personal data is processed when you use ${SITE_URL}.`,
          ],
        },
        {
          heading: "Data we collect",
          body: [
            "We may process your name, email address, account login details, listing information, uploaded property photos, video generation records, credit balance, payment status, contact messages, IP address, device/browser logs, and support communications.",
            "Card data is not collected by PropReel because payments are intended to be completed through secure iyzico payment links.",
          ],
        },
        {
          heading: "Purpose and third parties",
          body: [
            "We process data to create accounts, provide digital credit packages, generate AI real estate videos, prevent abuse, provide support, comply with legal obligations, and improve the service.",
            "Service providers may include Fal.ai for AI video generation, iyzico for payment processing, Vercel for hosting, Supabase for database/storage, Google for OAuth login, and email/contact service providers where applicable.",
          ],
        },
        {
          heading: "Retention and rights",
          body: [
            "Account and transaction records are kept for the period required by law and for legitimate business records. Uploaded media and generated video records may be kept while your account is active or until deletion is requested where legally possible.",
            "You may request access, correction, deletion, restriction, objection, and information about data processing by contacting the seller email address.",
          ],
        },
      ],
    },
    tr: {
      title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
      sections: [
        {
          heading: "Veri sorumlusu",
          body: [
            `KVKK madde 10 kapsamında veri sorumlusu ${sellerTr}. Bu metin, ${SITE_URL} üzerinden sunulan PropReel dijital hizmetinin kullanımı sırasında kişisel verilerin nasıl işlendiğini açıklar.`,
          ],
        },
        {
          heading: "İşlenen kişisel veriler",
          body: [
            "Ad, soyad, e-posta, hesap bilgileri, ilan bilgileri, yüklenen emlak fotoğrafları, video üretim kayıtları, kredi bakiyesi, ödeme durumu, iletişim mesajları, IP adresi, cihaz/tarayıcı kayıtları ve destek yazışmaları işlenebilir.",
            "Kart bilgileri PropReel tarafından saklanmaz. Ödemeler iyzico güvenli ödeme linkleri üzerinden tamamlanır.",
          ],
        },
        {
          heading: "İşleme amaçları, hukuki sebepler ve aktarım",
          body: [
            "Kişisel veriler; hesap oluşturma, dijital kredi satışı, AI video üretimi, hizmet güvenliği, destek, yasal yükümlülükler ve hizmet iyileştirme amaçlarıyla işlenir.",
            "Veriler; Fal.ai, iyzico, Vercel, Supabase, Google OAuth ve gerekli teknik hizmet sağlayıcılarla hizmetin yürütülmesi amacıyla paylaşılabilir. Aktarım, KVKK ve ilgili mevzuattaki hukuki sebeplere dayanır.",
          ],
        },
        {
          heading: "Saklama süresi ve KVKK hakları",
          body: [
            "Hesap ve işlem kayıtları yasal saklama süreleri boyunca; medya ve video kayıtları hesabın aktif olduğu süre boyunca veya hukuken mümkün olduğunda silme talebine kadar saklanabilir.",
            "KVKK madde 11 kapsamındaki haklarınızı kullanmak için satıcı e-posta adresi üzerinden başvurabilirsiniz.",
          ],
        },
      ],
    },
  },
  distanceSalesContract: {
    lastUpdated: LEGAL_LAST_UPDATED,
    en: {
      title: "Distance Sales Agreement",
      sections: [
        {
          heading: "Parties and service",
          body: [
            `Seller: ${sellerEn}. Buyer: the user purchasing a digital credit package through PropReel.`,
            PRODUCT_SUMMARY,
          ],
        },
        {
          heading: "Price and delivery",
          body: [
            "The product is a digital service credit package priced in USD as displayed on the Pricing page. No physical delivery is made.",
            "Credits are assigned to the user's PropReel account after payment confirmation and can be used for video generation.",
          ],
        },
        {
          heading: "Right of withdrawal",
          body: [
            "The buyer may have a 14-day withdrawal right for unused digital credits, subject to applicable law.",
            "If the buyer starts using digital credits or requests immediate performance of the digital service, the buyer acknowledges that the withdrawal right may be lost for used credits and generated videos.",
          ],
        },
        {
          heading: "Digital service performance and disputes",
          body: [
            "The service is delivered electronically. Performance starts when credits are assigned to the account and the buyer uses those credits to request video generation.",
            "For cancellation, refund, or dispute requests, the buyer should contact the seller email first. Mandatory consumer rights and competent consumer authorities remain reserved where applicable.",
          ],
        },
      ],
    },
    tr: {
      title: "Mesafeli Satış Sözleşmesi",
      sections: [
        {
          heading: "Taraflar ve hizmet konusu",
          body: [
            `Satıcı: ${sellerTr}. Alıcı: PropReel üzerinden dijital kredi paketi satın alan kullanıcıdır.`,
            "Sözleşmenin konusu, emlak ilanları için AI destekli video üretiminde kullanılan dijital hizmet kredilerinin satışıdır. Fiziksel ürün teslimatı yoktur.",
          ],
        },
        {
          heading: "Fiyat, ödeme ve teslimat",
          body: [
            "Kredi paketlerinin fiyatı Pricing sayfasında USD olarak açıkça gösterilir. Ödeme iyzico güvenli ödeme linkleri üzerinden tamamlanır.",
            "Ödeme onayından sonra dijital krediler kullanıcının PropReel hesabına tanımlanır. Teslimat elektronik ortamda yapılır.",
          ],
        },
        {
          heading: "Cayma hakkı ve dijital içerik istisnası",
          body: [
            "Mesafeli Sözleşmeler Yönetmeliği (RG 27.11.2014/29188) kapsamında tüketici, kullanılmamış dijital krediler için 14 gün içinde cayma hakkına sahip olabilir.",
            "Kullanıcı, kredileri kullanarak video üretimini başlattığında dijital hizmetin ifasına açık rıza vermiş sayılır ve kullanılan krediler bakımından cayma hakkının düşebileceğini kabul eder.",
          ],
        },
        {
          heading: "Dijital hizmetin ifası ve uyuşmazlık",
          body: [
            "Hizmet elektronik ortamda sunulur. Dijital krediler hesaba tanımlandığında teslimat yapılmış olur; kullanıcının krediyle video üretimi başlatması dijital hizmetin ifasına başlanması anlamına gelir.",
            "İptal, iade veya uyuşmazlık taleplerinde öncelikle satıcı e-posta adresi üzerinden başvuru yapılmalıdır. Tüketici mevzuatından doğan zorunlu haklar ve yetkili tüketici mercilerine başvuru hakkı saklıdır.",
          ],
        },
      ],
    },
  },
  cancellationPolicy: {
    lastUpdated: LEGAL_LAST_UPDATED,
    en: {
      title: "Cancellation & Refund Policy",
      sections: [
        {
          heading: "Unused credits",
          body: [
            "Refund requests for unused digital credits may be submitted within 14 days from purchase by emailing the seller.",
            `Refund and cancellation requests must be sent to ${SELLER_INFO.email}.`,
          ],
        },
        {
          heading: "Used credits",
          body: [
            "Credits consumed for video generation are not refundable because the digital service begins immediately at the user's request.",
            "If a video generation fails and the system refunds credits automatically, those credits remain available in the user account.",
          ],
        },
        {
          heading: "Dispute contact",
          body: [
            `Refund objections, payment questions, and digital delivery issues should be sent to ${SELLER_INFO.email} with the account email and package name.`,
          ],
        },
      ],
    },
    tr: {
      title: "İptal ve İade Koşulları",
      sections: [
        {
          heading: "Kullanılmamış krediler",
          body: [
            "Kullanılmamış dijital krediler için satın alma tarihinden itibaren 14 gün içinde iade talebi oluşturulabilir.",
            `İptal ve iade talepleri ${SELLER_INFO.email} adresine e-posta ile iletilmelidir.`,
          ],
        },
        {
          heading: "Kullanılmış krediler ve dijital hizmet istisnası",
          body: [
            "Video üretimi için kullanılan krediler iade edilmez. Çünkü kullanıcı talebiyle dijital hizmetin ifasına başlanmış olur.",
            "Sistemsel video üretim hatalarında uygulama krediyi otomatik iade ederse, iade edilen kredi kullanıcının hesabında tekrar kullanılabilir.",
          ],
        },
        {
          heading: "Uyuşmazlık ve başvuru kanalı",
          body: [
            `İade itirazları, ödeme soruları ve dijital teslimat sorunları için hesap e-postası ve paket adıyla birlikte ${SELLER_INFO.email} adresine başvurulmalıdır.`,
            "Tüketici mevzuatından doğan zorunlu haklar ve yetkili tüketici hakem heyeti veya mahkemelere başvuru hakkı saklıdır.",
          ],
        },
      ],
    },
  },
  preliminaryInformation: {
    lastUpdated: LEGAL_LAST_UPDATED,
    en: {
      title: "Preliminary Information Form",
      sections: [
        {
          heading: "Seller and service",
          body: [
            `Seller: ${sellerEn}.`,
            "Service: digital credit packages used for AI-powered real estate marketing video generation on PropReel.",
          ],
        },
        {
          heading: "Price, payment, and withdrawal",
          body: [
            "Package names, credit amounts, and USD prices are shown on the Pricing page before purchase.",
            "Payment is completed through secure iyzico payment links. Credits are delivered digitally after payment confirmation.",
            "The buyer should review the withdrawal and refund conditions before payment. Used digital credits are not refundable.",
            "By using credits for video generation, the buyer requests immediate performance of the digital service for those credits.",
          ],
        },
      ],
    },
    tr: {
      title: "Ön Bilgilendirme Formu",
      sections: [
        {
          heading: "Satıcı ve hizmet bilgisi",
          body: [
            `Satıcı: ${sellerTr}.`,
            "Hizmet: PropReel üzerinde AI destekli emlak pazarlama videosu üretimi için kullanılan dijital kredi paketleridir.",
          ],
        },
        {
          heading: "Fiyat, ödeme ve cayma hakkı",
          body: [
            "Paket adı, kredi miktarı ve USD fiyatı satın alma öncesinde Pricing sayfasında gösterilir.",
            "Ödeme iyzico güvenli ödeme linkleri üzerinden tamamlanır. Krediler ödeme onayından sonra dijital olarak hesaba tanımlanır.",
            "Alıcı ödeme öncesinde cayma ve iade koşullarını incelemelidir. Kullanılmış dijital krediler iade edilmez.",
            "Alıcı, kredileri video üretimi için kullandığında ilgili krediler bakımından dijital hizmetin derhal ifasını talep etmiş sayılır.",
          ],
        },
      ],
    },
  },
};
