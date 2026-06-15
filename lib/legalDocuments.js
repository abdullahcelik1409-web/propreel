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
            `The seller and data controller for Viseo is ${sellerEn}. This policy explains how personal data is processed when you use ${SITE_URL}.`,
          ],
        },
        {
          heading: "Data we collect",
          body: [
            "We may process your name, email address, account login details, listing information, uploaded property photos, video generation records, credit balance, payment status, contact messages, IP address, device/browser logs, and support communications.",
            "Card data is not collected by Viseo because payments are processed through Lemon Squeezy Checkout. Lemon Squeezy acts as merchant of record for payment, tax, invoice, and checkout handling.",
          ],
        },
        {
          heading: "Purpose and third parties",
          body: [
            "We process data to create accounts, provide digital credit packages, generate AI real estate videos, prevent abuse, provide support, comply with legal obligations, and improve the service.",
            "Service providers may include Fal.ai for AI video generation, Lemon Squeezy for payment processing and merchant-of-record services, Vercel for hosting, Supabase for database/storage, Google for OAuth login, and email/contact service providers where applicable.",
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
      title: "Gizlilik PolitikasÄ± ve KVKK AydÄ±nlatma Metni",
      sections: [
        {
          heading: "Veri sorumlusu",
          body: [
            `KVKK madde 10 kapsamÄ±nda veri sorumlusu ${sellerTr}. Bu metin, ${SITE_URL} Ã¼zerinden sunulan Viseo dijital hizmetinin kullanÄ±mÄ± sÄ±rasÄ±nda kiÅŸisel verilerin nasÄ±l iÅŸlendiÄŸini aÃ§Ä±klar.`,
          ],
        },
        {
          heading: "Ä°ÅŸlenen kiÅŸisel veriler",
          body: [
            "Ad, soyad, e-posta, hesap bilgileri, ilan bilgileri, yÃ¼klenen emlak fotoÄŸraflarÄ±, video Ã¼retim kayÄ±tlarÄ±, kredi bakiyesi, Ã¶deme durumu, iletiÅŸim mesajlarÄ±, IP adresi, cihaz/tarayÄ±cÄ± kayÄ±tlarÄ± ve destek yazÄ±ÅŸmalarÄ± iÅŸlenebilir.",
            "Kart bilgileri Viseo tarafÄ±ndan saklanmaz. Ã–demeler Lemon Squeezy Checkout Ã¼zerinden iÅŸlenir; Ã¶deme, vergi ve fatura sÃ¼reÃ§lerinde Lemon Squeezy merchant of record olarak gÃ¶rev yapar.",
          ],
        },
        {
          heading: "Ä°ÅŸleme amaÃ§larÄ±, hukuki sebepler ve aktarÄ±m",
          body: [
            "KiÅŸisel veriler; hesap oluÅŸturma, dijital kredi satÄ±ÅŸÄ±, AI video Ã¼retimi, hizmet gÃ¼venliÄŸi, destek, yasal yÃ¼kÃ¼mlÃ¼lÃ¼kler ve hizmet iyileÅŸtirme amaÃ§larÄ±yla iÅŸlenir.",
            "Veriler; Fal.ai, Lemon Squeezy, Vercel, Supabase, Google OAuth ve gerekli teknik hizmet saÄŸlayÄ±cÄ±larla hizmetin yÃ¼rÃ¼tÃ¼lmesi amacÄ±yla paylaÅŸÄ±labilir. AktarÄ±m, KVKK ve ilgili mevzuattaki hukuki sebeplere dayanÄ±r.",
          ],
        },
        {
          heading: "Saklama sÃ¼resi ve KVKK haklarÄ±",
          body: [
            "Hesap ve iÅŸlem kayÄ±tlarÄ± yasal saklama sÃ¼releri boyunca; medya ve video kayÄ±tlarÄ± hesabÄ±n aktif olduÄŸu sÃ¼re boyunca veya hukuken mÃ¼mkÃ¼n olduÄŸunda silme talebine kadar saklanabilir.",
            "KVKK madde 11 kapsamÄ±ndaki haklarÄ±nÄ±zÄ± kullanmak iÃ§in satÄ±cÄ± e-posta adresi Ã¼zerinden baÅŸvurabilirsiniz.",
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
            `Seller: ${sellerEn}. Buyer: the user purchasing a digital credit package through Viseo.`,
            PRODUCT_SUMMARY,
          ],
        },
        {
          heading: "Price and delivery",
          body: [
            "The product is a digital service credit package priced in USD as displayed on the Pricing page. No physical delivery is made.",
            "Payments are processed by Lemon Squeezy as merchant of record. Lemon Squeezy may calculate applicable taxes and final checkout totals based on buyer location.",
            "Credits are assigned to the user's Viseo account after payment confirmation and can be used for video generation.",
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
      title: "Mesafeli SatÄ±ÅŸ SÃ¶zleÅŸmesi",
      sections: [
        {
          heading: "Taraflar ve hizmet konusu",
          body: [
            `SatÄ±cÄ±: ${sellerTr}. AlÄ±cÄ±: Viseo Ã¼zerinden dijital kredi paketi satÄ±n alan kullanÄ±cÄ±dÄ±r.`,
            "SÃ¶zleÅŸmenin konusu, emlak ilanlarÄ± iÃ§in AI destekli video Ã¼retiminde kullanÄ±lan dijital hizmet kredilerinin satÄ±ÅŸÄ±dÄ±r. Fiziksel Ã¼rÃ¼n teslimatÄ± yoktur.",
          ],
        },
        {
          heading: "Fiyat, Ã¶deme ve teslimat",
          body: [
            "Kredi paketlerinin fiyatÄ± Pricing sayfasÄ±nda USD olarak aÃ§Ä±kÃ§a gÃ¶sterilir. Ã–deme Lemon Squeezy Checkout Ã¼zerinden tamamlanÄ±r ve Lemon Squeezy merchant of record olarak Ã¶deme, vergi ve fatura sÃ¼recini yÃ¼rÃ¼tÃ¼r.",
            "Ã–deme onayÄ±ndan sonra dijital krediler kullanÄ±cÄ±nÄ±n Viseo hesabÄ±na tanÄ±mlanÄ±r. Teslimat elektronik ortamda yapÄ±lÄ±r.",
          ],
        },
        {
          heading: "Cayma hakkÄ± ve dijital iÃ§erik istisnasÄ±",
          body: [
            "Mesafeli SÃ¶zleÅŸmeler YÃ¶netmeliÄŸi (RG 27.11.2014/29188) kapsamÄ±nda tÃ¼ketici, kullanÄ±lmamÄ±ÅŸ dijital krediler iÃ§in 14 gÃ¼n iÃ§inde cayma hakkÄ±na sahip olabilir.",
            "KullanÄ±cÄ±, kredileri kullanarak video Ã¼retimini baÅŸlattÄ±ÄŸÄ±nda dijital hizmetin ifasÄ±na aÃ§Ä±k rÄ±za vermiÅŸ sayÄ±lÄ±r ve kullanÄ±lan krediler bakÄ±mÄ±ndan cayma hakkÄ±nÄ±n dÃ¼ÅŸebileceÄŸini kabul eder.",
          ],
        },
        {
          heading: "Dijital hizmetin ifasÄ± ve uyuÅŸmazlÄ±k",
          body: [
            "Hizmet elektronik ortamda sunulur. Dijital krediler hesaba tanÄ±mlandÄ±ÄŸÄ±nda teslimat yapÄ±lmÄ±ÅŸ olur; kullanÄ±cÄ±nÄ±n krediyle video Ã¼retimi baÅŸlatmasÄ± dijital hizmetin ifasÄ±na baÅŸlanmasÄ± anlamÄ±na gelir.",
            "Ä°ptal, iade veya uyuÅŸmazlÄ±k taleplerinde Ã¶ncelikle satÄ±cÄ± e-posta adresi Ã¼zerinden baÅŸvuru yapÄ±lmalÄ±dÄ±r. TÃ¼ketici mevzuatÄ±ndan doÄŸan zorunlu haklar ve yetkili tÃ¼ketici mercilerine baÅŸvuru hakkÄ± saklÄ±dÄ±r.",
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
            "Refund requests for unused digital credits may be submitted within 14 days from purchase by emailing support, subject to applicable law and Lemon Squeezy policies.",
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
            `Refund objections, Lemon Squeezy payment questions, and digital delivery issues should be sent to ${SELLER_INFO.email} with the account email and package name.`,
          ],
        },
      ],
    },
    tr: {
      title: "Ä°ptal ve Ä°ade KoÅŸullarÄ±",
      sections: [
        {
          heading: "KullanÄ±lmamÄ±ÅŸ krediler",
          body: [
            "KullanÄ±lmamÄ±ÅŸ dijital krediler iÃ§in satÄ±n alma tarihinden itibaren 14 gÃ¼n iÃ§inde iade talebi oluÅŸturulabilir.",
            `Ä°ptal ve iade talepleri ${SELLER_INFO.email} adresine e-posta ile iletilmelidir.`,
          ],
        },
        {
          heading: "KullanÄ±lmÄ±ÅŸ krediler ve dijital hizmet istisnasÄ±",
          body: [
            "Video Ã¼retimi iÃ§in kullanÄ±lan krediler iade edilmez. Ã‡Ã¼nkÃ¼ kullanÄ±cÄ± talebiyle dijital hizmetin ifasÄ±na baÅŸlanmÄ±ÅŸ olur.",
            "Sistemsel video Ã¼retim hatalarÄ±nda uygulama krediyi otomatik iade ederse, iade edilen kredi kullanÄ±cÄ±nÄ±n hesabÄ±nda tekrar kullanÄ±labilir.",
          ],
        },
        {
          heading: "UyuÅŸmazlÄ±k ve baÅŸvuru kanalÄ±",
          body: [
            `Ä°ade itirazlarÄ±, Ã¶deme sorularÄ± ve dijital teslimat sorunlarÄ± iÃ§in hesap e-postasÄ± ve paket adÄ±yla birlikte ${SELLER_INFO.email} adresine baÅŸvurulmalÄ±dÄ±r.`,
            "TÃ¼ketici mevzuatÄ±ndan doÄŸan zorunlu haklar ve yetkili tÃ¼ketici hakem heyeti veya mahkemelere baÅŸvuru hakkÄ± saklÄ±dÄ±r.",
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
            "Service: digital credit packages used for AI-powered real estate marketing video generation on Viseo.",
          ],
        },
        {
          heading: "Price, payment, and withdrawal",
          body: [
            "Package names, credit amounts, and USD prices are shown on the Pricing page before purchase.",
            "Payments are processed by Lemon Squeezy as merchant of record. Lemon Squeezy may calculate taxes and final totals at checkout.",
            "Payment is completed through secure Lemon Squeezy Checkout. Credits are delivered digitally after verified webhook confirmation.",
            "The buyer should review the withdrawal and refund conditions before payment. Used digital credits are not refundable.",
            "By using credits for video generation, the buyer requests immediate performance of the digital service for those credits.",
          ],
        },
      ],
    },
    tr: {
      title: "Ã–n Bilgilendirme Formu",
      sections: [
        {
          heading: "SatÄ±cÄ± ve hizmet bilgisi",
          body: [
            `SatÄ±cÄ±: ${sellerTr}.`,
            "Hizmet: Viseo Ã¼zerinde AI destekli emlak pazarlama videosu Ã¼retimi iÃ§in kullanÄ±lan dijital kredi paketleridir.",
          ],
        },
        {
          heading: "Fiyat, Ã¶deme ve cayma hakkÄ±",
          body: [
            "Paket adÄ±, kredi miktarÄ± ve USD fiyatÄ± satÄ±n alma Ã¶ncesinde Pricing sayfasÄ±nda gÃ¶sterilir.",
            "Ã–deme Lemon Squeezy Checkout Ã¼zerinden tamamlanÄ±r. Krediler yalnÄ±zca doÄŸrulanmÄ±ÅŸ Lemon Squeezy webhook onayÄ±ndan sonra dijital olarak hesaba tanÄ±mlanÄ±r.",
            "AlÄ±cÄ± Ã¶deme Ã¶ncesinde cayma ve iade koÅŸullarÄ±nÄ± incelemelidir. KullanÄ±lmÄ±ÅŸ dijital krediler iade edilmez.",
            "AlÄ±cÄ±, kredileri video Ã¼retimi iÃ§in kullandÄ±ÄŸÄ±nda ilgili krediler bakÄ±mÄ±ndan dijital hizmetin derhal ifasÄ±nÄ± talep etmiÅŸ sayÄ±lÄ±r.",
          ],
        },
      ],
    },
  },
};

