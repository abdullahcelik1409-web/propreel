const TURKISH_CHARACTERS = /[çğıöşüÇĞİÖŞÜ]/;
const COMMON_TURKISH_WORDS = /\b(satilik|satılık|kiralik|kiralık|daire|konut|emlak|detay|detaylar|icin|için|mesaj|manzarali|manzaralı|esyali|eşyalı|odas?i|odası)\b/i;

const PROPERTY_TYPE_LABELS = Object.freeze({
  apartment: "Apartment",
  flat: "Apartment",
  villa: "Villa",
  house: "House",
  residence: "Residence",
  penthouse: "Penthouse",
  land: "Land",
  office: "Office",
  commercial: "Commercial Property",
  daire: "Apartment",
  mustakil: "Detached House",
  müstakil: "Detached House",
  arsa: "Land",
  ofis: "Office",
});

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function englishSafe(value) {
  const text = clean(value);
  return text && !TURKISH_CHARACTERS.test(text) && !COMMON_TURKISH_WORDS.test(text) ? text : "";
}

function first(...values) {
  return values.map(englishSafe).find(Boolean) || "";
}

function normalizeFeatureValues(property) {
  const values = [property?.features, property?.amenities].flat().filter(Boolean);
  return values.map(englishSafe).filter(Boolean);
}

export function buildPropertyType(property = {}) {
  const raw = clean(property.property_type || property.propertyType || property.listing_type);
  return PROPERTY_TYPE_LABELS[raw.toLocaleLowerCase("en-US")] || englishSafe(raw) || "Featured Property";
}

export function buildLocation(property = {}) {
  return first(property.location, [property.city, property.country].filter(Boolean).join(", ")) || "Prime Location";
}

export function buildTitle(property = {}) {
  return first(property.title) || `${buildPropertyType(property)} in ${buildLocation(property)}`;
}

export function buildSpecsSummary(property = {}) {
  const bedrooms = Number(property.bedrooms);
  const bathrooms = Number(property.bathrooms);
  const area = clean(property.area || property.sqft);
  const unit = englishSafe(property.area_unit) || (property.sqft ? "sq ft" : "");
  const parts = [];
  if (bedrooms > 0) parts.push(`${bedrooms} Bed${bedrooms === 1 ? "" : "s"}`);
  if (bathrooms > 0) parts.push(`${bathrooms} Bath${bathrooms === 1 ? "" : "s"}`);
  if (area) parts.push(`${area} ${unit}`.trim());
  return parts.join(" · ") || "Thoughtfully Designed";
}

export function buildPriceLine(property = {}) {
  const price = clean(property.price);
  if (!price) return "";
  const currency = englishSafe(property.currency);
  const purpose = clean(property.purpose).toLowerCase();
  const suffix = purpose === "rent" ? " / month" : "";
  return `${currency ? `${currency} ` : ""}${price}${suffix}`.trim();
}

export function buildFeatureHighlights(property = {}) {
  const features = normalizeFeatureValues(property);
  const fallbacks = [
    englishSafe(property.view),
    englishSafe(property.furnishing),
    buildSpecsSummary(property),
    "Refined Living",
  ].filter(Boolean);
  return [...new Set([...features, ...fallbacks])].slice(0, 2);
}

export function buildCTA(property = {}) {
  return first(property.contact_cta) || "DM for details";
}

export function buildHook(property = {}) {
  const purpose = clean(property.purpose).toLowerCase();
  if (purpose === "rent") return "Your next home awaits";
  if (purpose === "sale") return "Now available";
  return "Step inside";
}

export function resolvePropertyContent(property = {}) {
  const highlights = buildFeatureHighlights(property);
  return Object.freeze({
    title: buildTitle(property),
    property_type: buildPropertyType(property),
    location: buildLocation(property),
    price: buildPriceLine(property),
    specs_summary: buildSpecsSummary(property),
    feature_highlight: highlights[0] || "Refined Living",
    feature_highlight_2: highlights[1] || "Designed for modern life",
    hook: buildHook(property),
    cta: buildCTA(property),
  });
}
