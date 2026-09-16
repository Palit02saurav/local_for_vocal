"use client";

import "./filter.css";

const categories = ["All Categories", "Handicrafts", "Local Food", "Organic", "Clothing", "Home Decor"];

export default function Filter({
  selectedCategory, setSelectedCategory,
  priceRange, setPriceRange,
  verifiedOnly, setVerifiedOnly,
  localArtisans, setLocalArtisans,
  homeBusinesses, setHomeBusinesses,
  selectedRating, setSelectedRating,
  inStockOnly, setInStockOnly,
  onClearAll,
  onApply,
}) {
  return (
    <div className="filter">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="clear-btn" onClick={onClearAll}>Clear All</button>
      </div>

      {/* Category */}
      <div className="filter-section">
        <h4>Category</h4>
        {categories.map((cat) => (
          <label key={cat}>
            <input
              type="checkbox"
              checked={selectedCategory === cat}
              onChange={() => setSelectedCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <input
          type="range"
          min="0"
          max="10000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
        />
        <div className="price-range">
          <span>₹0</span>
          <span>₹{priceRange.toLocaleString()}+</span>
        </div>
      </div>

      {/* Verified sellers */}
      <div className="filter-section">
        <h4>Seller Type</h4>
        <label>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
          Verified Sellers Only
        </label>
        <label>
          <input
            type="checkbox"
            checked={localArtisans}
            onChange={(e) => setLocalArtisans(e.target.checked)}
          />
          Local Artisans
        </label>
        <label>
          <input
            type="checkbox"
            checked={homeBusinesses}
            onChange={(e) => setHomeBusinesses(e.target.checked)}
          />
          Home Businesses
        </label>
      </div>

      {/* Rating */}
      <div className="filter-section">
        <h4>Rating</h4>
        {[
          { min: 5, label: "★★★★★ 5 stars only" },
          { min: 4, label: "★★★★☆ 4 & above" },
          { min: 3, label: "★★★☆☆ 3 & above" },
          { min: 2, label: "★★☆☆☆ 2 & above" },
        ].map((r) => (
          <label key={r.min}>
            <input
              type="checkbox"
              checked={selectedRating === r.min}
              onChange={() => setSelectedRating(selectedRating === r.min ? null : r.min)}
            />
            {r.label}
          </label>
        ))}
      </div>

      {/* Stock */}
      <div className="filter-section">
        <h4>Availability</h4>
        <label>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          In Stock Only
        </label>
      </div>

      <button className="apply-filter" onClick={onApply}>Apply Filters</button>
    </div>
  );
}