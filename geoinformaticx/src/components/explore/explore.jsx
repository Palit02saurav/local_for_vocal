"use client";

import Link from "next/link";
import {
  FaSearch,
  FaLocationArrow,
  FaSlidersH,
  FaPaintBrush,
  FaUtensils,
  FaLeaf,
  FaTshirt,
  FaCouch,
  FaBroom,
  FaChalkboardTeacher,
  FaWrench,
} from "react-icons/fa";
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  LISTING_TYPES,
  BUSINESS_TYPES,
  RATING_OPTIONS,
} from "@/lib/categories";
import "./explore.css";

const CATEGORY_ICONS = {
  Handicrafts: FaPaintBrush,
  "Local Food": FaUtensils,
  Organic: FaLeaf,
  Clothing: FaTshirt,
  "Home Decor": FaCouch,
  Maid: FaBroom,
  Teacher: FaChalkboardTeacher,
  Plumber: FaWrench,
};

export default function Explore({
  listingType = "All",
  setListingType = () => {},
  selectedCategory,
  setSelectedCategory,
  businessType = "All",
  setBusinessType = () => {},
  minRating = 0,
  setMinRating = () => {},
  distanceKm = 20,
  setDistanceKm = () => {},
  searchQuery = "",
  setSearchQuery = () => {},
  onLocate = () => {},
}) {
  // Which categories the "Category" dropdown and "Top Categories" list show
  // depends entirely on whether Products, Services, or All is selected.
  const categoryOptions =
    listingType === "Products"
      ? PRODUCT_CATEGORIES
      : listingType === "Services"
      ? SERVICE_CATEGORIES
      : [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES];

  const hasActiveFilters =
    listingType !== "All" ||
    selectedCategory !== "All" ||
    businessType !== "All" ||
    minRating !== 0 ||
    distanceKm !== 20;

  function clearAll() {
    setListingType("All");
    setSelectedCategory("All");
    setBusinessType("All");
    setMinRating(0);
    setDistanceKm(20);
  }

  function handleListingTypeChange(value) {
    setListingType(value);
    // The old category no longer necessarily applies to the new type.
    setSelectedCategory("All");
  }

  return (
    <div className="explore-sidebar">
      <div className="explore-header">
        <h2>Explore Local Businesses</h2>
        <p>Discover unique local products and shops near you.</p>
      </div>

      <div className="explore-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          className="locate-btn"
          onClick={onLocate}
          aria-label="Use my current location"
        >
          <FaLocationArrow />
        </button>
      </div>

      <div className="explore-filters">
        <div className="filters-header">
          <h3>Filters</h3>
          {hasActiveFilters && (
            <button type="button" className="clear-all" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>

        <div className="filter-row">
          <label htmlFor="filter-listing-type">Type</label>
          <select
            id="filter-listing-type"
            value={listingType}
            onChange={(e) => handleListingTypeChange(e.target.value)}
          >
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "Products & Services" : t}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <label htmlFor="filter-type">Business Type</label>
          <select
            id="filter-type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="All">All Types</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <label htmlFor="filter-rating">Rating</label>
          <select
            id="filter-rating"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r.label} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row distance-row">
          <label htmlFor="filter-distance">Distance</label>
          <input
            id="filter-distance"
            type="range"
            min={1}
            max={20}
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
          />
          <div className="distance-labels">
            <span>1 km</span>
            <span>20 km+</span>
          </div>
        </div>

        <button type="button" className="more-filters-btn">
          <FaSlidersH /> More Filters
        </button>
      </div>

      <div className="top-categories">
        <div className="top-categories-header">
          <h3>Top Categories</h3>
          <Link href="#" className="view-all-link">
            View All &gt;
          </Link>
        </div>
        <ul>
          {categoryOptions.map((c) => {
            const Icon = CATEGORY_ICONS[c.name];
            const active = selectedCategory === c.name;
            return (
              <li
                key={c.name}
                className={active ? "active" : ""}
                onClick={() => setSelectedCategory(active ? "All" : c.name)}
              >
                <span className="cat-icon" style={{ color: c.color }}>
                  <Icon />
                </span>
                <span>{c.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}