// District → regional specialty lookup, mirroring the specialties shown on
// the storefront map (front/src/app/map/map.jsx `districts`). Used on the
// seller dashboard to suggest a product/service tied to the seller's own
// district's famous item.
export const districtSpecialties = {
  "Darjeeling": "Darjeeling Tea",
  "Jalpaiguri": "Tea Gardens",
  "Alipurduar": "Dooars Tea & Forests",
  "Cooch Behar": "Sitalpati Cane Mats",
  "Kalimpong": "Handmade Cheese & Orchids",
  "Uttar Dinajpur": "Litchi & Mangoes",
  "Dakshin Dinajpur": "Tulaipanji Rice",
  "Malda": "Malda Mangoes",
  "Murshidabad": "Murshidabad Silk",
  "Birbhum": "Nakshi Kantha & Leatherwork",
  "Nadia": "Shantipur Handloom",
  "Purba Bardhaman": "Sitabhog & Mihidana Sweets",
  "Paschim Bardhaman": "Steel & Coal Industry",
  "Purulia": "Chhau Mask & Dance",
  "Bankura": "Dokra & Terracotta Craft",
  "Jhargram": "Tribal Sal-leaf Crafts",
  "Paschim Medinipur": "Patachitra Scroll Art",
  "Purba Medinipur": "Sitalpati Mats & Coconut",
  "Hooghly": "Dhaniakhali Handloom",
  "Howrah": "Foundry & Metal Casting",
  "North 24 Parganas": "Leather Industry",
  "South 24 Parganas": "Joynagar Moa & Sundarbans Honey",
  "Kolkata": "Rosogolla & Sweets",
};

// Seller `location` is free text, so match it loosely against the district
// names above instead of requiring an exact match.
export function findDistrictSpecialty(locationText) {
  if (!locationText) return null;
  const normalized = locationText.trim().toLowerCase();
  const match = Object.keys(districtSpecialties).find(
    (district) =>
      normalized.includes(district.toLowerCase()) ||
      district.toLowerCase().includes(normalized)
  );
  return match ? { district: match, specialty: districtSpecialties[match] } : null;
}

const SPECIALTY_STOP_WORDS = new Set([
  "and", "the", "of", "craft", "crafts", "industry", "art",
]);

function specialtyKeywords(specialtyText) {
  return specialtyText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !SPECIALTY_STOP_WORDS.has(word));
}

export function productMatchesSpecialty(product, specialtyText) {
  if (!product || !specialtyText) return false;
  const haystack = `${product.name || ""} ${product.category || ""}`.toLowerCase();
  return specialtyKeywords(specialtyText).some((keyword) => haystack.includes(keyword));
}