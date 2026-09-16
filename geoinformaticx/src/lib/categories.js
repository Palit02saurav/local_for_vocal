// Shared source of truth for category names + colors so the sidebar filters,
// the top-category icons, and the legend never drift out of sync.

export const PRODUCT_CATEGORIES = [
  { name: "Handicrafts", color: "#2f8d46" },
  { name: "Local Food", color: "#e07b2a" },
  { name: "Organic", color: "#2a9d8f" },
  { name: "Clothing", color: "#e63946" },
  { name: "Home Decor", color: "#7b5fc4" },
];

export const SERVICE_CATEGORIES = [
  { name: "Maid", color: "#ff6b9d" },
  { name: "Teacher", color: "#3a86ff" },
  { name: "Plumber", color: "#fb8500" },
];

// Kept as an alias so any existing code importing CATEGORIES still works —
// it always meant "the product categories".
export const CATEGORIES = PRODUCT_CATEGORIES;

// Shown only in the map legend — covers any business that doesn't fall
// into one of the named categories above.
export const OTHER_CATEGORY = { name: "Other Shops", color: "#6c757d" };

export const ALL_LEGEND_CATEGORIES = [
  ...PRODUCT_CATEGORIES,
  ...SERVICE_CATEGORIES,
  OTHER_CATEGORY,
];

// Top-level split shown above the Category dropdown.
export const LISTING_TYPES = ["All", "Products", "Services"];

export const BUSINESS_TYPES = [
  "Retail Shop",
  "Home-based",
  "Farm / Producer",
  "Service Provider",
  "Online Only",
];

export const RATING_OPTIONS = [
  { label: "All Ratings", value: 0 },
  { label: "4.5 & up", value: 4.5 },
  { label: "4.0 & up", value: 4 },
  { label: "3.0 & up", value: 3 },
];

export function categoryColor(categoryName) {
  const match = [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES].find(
    (c) => c.name === categoryName
  );
  return match ? match.color : OTHER_CATEGORY.color;
}