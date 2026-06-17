import { getActivePaymentProviderConfig } from "./payments/providerConfig.js";

export const SITE_URL = "https://www.getviseo.com";

export const SELLER_INFO = {
  name: "Emine \u00c7elik",
  displayName: "Emine \u00c7elik",
  phone: "0552 335 1325",
  email: "eminecelik2525.e@gmail.com",
  address: "K\u00fc\u00e7\u00fckyal\u0131 Mahallesi, R\u00fc\u015ft\u00fc Sarp Caddesi No:18 Daire:23, Maltepe / \u0130stanbul",
  footerLine:
    "Emine \u00c7elik | K\u00fc\u00e7\u00fckyal\u0131 Mah. R\u00fc\u015ft\u00fc Sarp Cad. No:18 D:23 Maltepe/\u0130stanbul | 0552 335 1325 | eminecelik2525.e@gmail.com",
};

export const LEGAL_LAST_UPDATED = "13 June 2026";

export const LEGAL_LINKS = [
  ["Privacy Policy", "/privacy"],
  ["Terms & Conditions", "/terms"],
  ["Refund Policy", "/refund-policy"],
  ["Preliminary Information Form", "/legal/preliminary-information"],
  ["Contact / Support", "/contact"],
];

export const MARKETING_NAV_LINKS = [
  ["Home", "/"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
];

export const PAYMENT_NOTICE = getActivePaymentProviderConfig().footerPaymentText;

export const PRODUCT_SUMMARY =
  "Viseo sells digital credit packages used to generate AI-powered real estate marketing videos. No physical shipment is provided.";
