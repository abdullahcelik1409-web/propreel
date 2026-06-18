export const PAYMENT_PROVIDERS = ["lemon", "polar", "paytr"];

export const LEGAL_MODELS = {
  MERCHANT_OF_RECORD: "merchant_of_record",
  PAYMENT_PROCESSOR: "payment_processor",
};

function normalizeProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase().replace(/_/g, "-");
  if (normalized === "lemon" || normalized === "lemon-squeezy" || normalized === "lemonsqueezy") return "lemon";
  if (normalized === "polar") return "polar";
  if (normalized === "paytr" || normalized === "pay-tr") return "paytr";
  return "";
}

export function getActivePaymentProvider(env = process.env) {
  const provider = normalizeProvider(env.PAYMENT_PROVIDER || "polar");
  if (!PAYMENT_PROVIDERS.includes(provider)) {
    throw new Error(`Unsupported PAYMENT_PROVIDER: ${env.PAYMENT_PROVIDER}`);
  }
  return provider;
}

export function resolvePaymentProvider(provider, env = process.env) {
  if (!provider) return getActivePaymentProvider(env);
  const normalized = normalizeProvider(provider);
  if (!PAYMENT_PROVIDERS.includes(normalized)) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return normalized;
}

function morText(displayName) {
  return {
    paymentProcessorText: `Payments may be securely processed by ${displayName} as Merchant of Record where applicable.`,
    refundProcessorText: `Refunds for eligible unused credits may be handled through ${displayName} where applicable.`,
    taxInvoiceText: `Taxes, receipts, and invoices may be handled by ${displayName} based on buyer location and checkout rules.`,
    privacyPaymentText: `Card-level payment data is not stored by Viseo. ${displayName} may process payment, tax, invoice, receipt, and checkout data as Merchant of Record where applicable.`,
    termsPaymentText: `${displayName} may act as Merchant of Record for checkout, payment, tax, invoice, and receipt handling where applicable.`,
    refundLegalText: `${displayName} may handle parts of the refund flow for eligible unused digital credits where applicable.`,
  };
}

function processorText(displayName) {
  return {
    paymentProcessorText: `Payments are processed through ${displayName}, but Viseo remains responsible for commercial, tax, invoice, and refund obligations.`,
    refundProcessorText: `Refund requests are reviewed by Viseo; ${displayName} processes the payment reversal when approved and supported.`,
    taxInvoiceText: `Viseo remains responsible for tax, invoice, and commercial obligations while ${displayName} processes the payment.`,
    privacyPaymentText: `Card-level payment data is not stored by Viseo. ${displayName} processes the payment transaction, while Viseo remains responsible for commercial records, tax, invoice, and refund handling.`,
    termsPaymentText: `Payments are processed through ${displayName}; Viseo remains the seller/platform responsible for commercial, tax, invoice, and refund obligations.`,
    refundLegalText: `Refund requests are reviewed by Viseo and, if approved, processed through ${displayName} where technically supported.`,
  };
}

export const paymentProviderConfig = {
  lemon: {
    provider: "lemon",
    displayName: "Lemon Squeezy",
    legalModel: LEGAL_MODELS.MERCHANT_OF_RECORD,
    checkoutLabel: "Buy Now",
    checkoutProviderLabel: "Secure checkout by Lemon Squeezy",
    footerPaymentText: "Secure USD payments via Lemon Squeezy - Cards - Apple Pay - Google Pay - PayPal",
    pricingPaymentNote: "Payments are securely processed by Lemon Squeezy. Lemon Squeezy may act as Merchant of Record where applicable.",
    supportedUseCaseNote: "Best for global one-time digital credit packages with hosted checkout, receipts, tax handling, and signed webhooks.",
    receiptText: "Open Viseo",
    customerSupportText: "For payment, receipt, tax, or refund questions, contact Viseo support first; Lemon Squeezy may also surface checkout-level support flows.",
    ...morText("Lemon Squeezy"),
    legalOverrides: {},
  },
  polar: {
    provider: "polar",
    displayName: "Polar",
    legalModel: LEGAL_MODELS.MERCHANT_OF_RECORD,
    checkoutLabel: "Pay securely with Polar",
    checkoutProviderLabel: "Secure checkout by Polar",
    footerPaymentText: "Secure USD payments by Polar - hosted checkout for digital credits",
    pricingPaymentNote: "Payments are processed securely by Polar. Applicable taxes may be calculated at checkout.",
    supportedUseCaseNote: "Best for hosted Polar product checkout while Viseo keeps credit delivery in its own Supabase ledger.",
    receiptText: "Open Viseo",
    customerSupportText: "For payment, receipt, tax, or refund questions, contact Viseo support first; Polar may provide checkout-level records where applicable.",
    ...morText("Polar"),
    paymentProcessorText: "Payments are securely processed by Polar.",
    taxInvoiceText: "Polar may act as Merchant of Record and may handle applicable taxes, receipts, and invoices where required.",
    refundProcessorText: "Refunds may be processed through Polar where applicable.",
    legalOverrides: {},
  },
  paytr: {
    provider: "paytr",
    displayName: "PayTR",
    legalModel: LEGAL_MODELS.PAYMENT_PROCESSOR,
    checkoutLabel: "Buy Now",
    checkoutProviderLabel: "Secure payment through PayTR",
    footerPaymentText: "Secure payments through PayTR - Viseo handles seller, tax, invoice, and refund obligations",
    pricingPaymentNote: "Payments are securely processed through PayTR. Viseo remains responsible for tax, invoicing, and refund handling.",
    supportedUseCaseNote: "Best for Turkey-focused card processing where Viseo remains the seller and commercial record owner.",
    receiptText: "Open Viseo",
    customerSupportText: "For payment, invoice, tax, delivery, or refund questions, contact Viseo support.",
    ...processorText("PayTR"),
    legalOverrides: {},
  },
};

export function getPaymentProviderConfig(provider, env = process.env) {
  return paymentProviderConfig[resolvePaymentProvider(provider, env)];
}

export function getActivePaymentProviderConfig(env = process.env) {
  return getPaymentProviderConfig(getActivePaymentProvider(env), env);
}
