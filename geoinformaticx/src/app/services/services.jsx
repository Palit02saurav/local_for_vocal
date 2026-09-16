"use client";

import "./services.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { addToCart } from "@/lib/cart";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Services() {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 9;
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState("Popularity");
  const [selectedService, setSelectedService] = useState(null);

  const [allServices, setAllServices] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/services/public")
      .then((res) => {
        const services = (res.data.data?.products || res.data.data?.services || []).map((s) => ({
          ...s,
          slug: s.sku,
          img: s.image_url || "https://placehold.co/300x300?text=No+Image",
        }));
        setAllServices(services);
      })
      .catch((err) => console.error("Failed to load services:", err));
  }, []);

  const syncWishlist = async () => {
    const list = await getWishlist();
    const map = {};
    list.forEach((item) => {
      if (item.type === "service") map[item.id] = item.wishlistItemId;
    });
    setWishlisted(map);
  };

  useEffect(() => {
    syncWishlist();
    window.addEventListener("storage", syncWishlist);
    return () => window.removeEventListener("storage", syncWishlist);
  }, []);

  const handleAddToCart = async (service) => {
    const result = await addToCart({ productId: service.id, type: "service" });
    if (result.requiresLogin) router.push("/login?redirect=/services");
  };

  const handleToggleWishlist = async (service) => {
    if (wishlisted[service.id]) {
      await removeFromWishlist(wishlisted[service.id]);
    } else {
      const result = await addToWishlist({ productId: service.id, type: "service" });
      if (result.requiresLogin) {
        router.push("/login?redirect=/services");
        return;
      }
    }
    syncWishlist();
  };

  const categories = ["All Categories", "Cleaning", "Repair", "Fashion", "Creative", "Food", "Education", "Wellness", "Beauty"];

  const filteredServices = allServices
    .filter((s) => {
      if (selectedCategory !== "All Categories" && s.category !== selectedCategory) return false;
      if (Number(s.price) > priceRange) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Price Low to High") return Number(a.price) - Number(b.price);
      if (sortBy === "Price High to Low") return Number(b.price) - Number(a.price);
      return 0;
    });

  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / cardsPerPage));

  return (
    <div className="services-page">
      {/* Header */}
      <div className="services-header">
        <div className="services-title">
          <h1>Services</h1>
          <p>Discover trusted local services from skilled professionals in your area.</p>
        </div>
        <div className="services-header-right">
          <span className="result-text">
            {filteredServices.length > 0
              ? `Showing ${(currentPage - 1) * cardsPerPage + 1} - ${Math.min(currentPage * cardsPerPage, filteredServices.length)} of ${filteredServices.length} results`
              : "No results found"}
          </span>
          <select className="sort-dropdown" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
            <option>Popularity</option>
            <option>Newest</option>
            <option>Price Low to High</option>
            <option>Price High to Low</option>
          </select>
          <button className="view-btn active">⊞</button>
          <button className="view-btn">☰</button>
        </div>
      </div>

      <div className="services-content">
        {/* Filter Sidebar */}
        <aside className="services-filter">
          <div className="filter">
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="clear-btn" onClick={() => { setSelectedCategory("All Categories"); setPriceRange(10000); setSelectedRating(null); setCurrentPage(1); }}>Clear All</button>
            </div>

            <div className="filter-section">
              <h4>Category</h4>
              {categories.map((cat) => (
                <label key={cat}>
                  <input type="checkbox" checked={selectedCategory === cat} onChange={() => { setSelectedCategory(cat); setCurrentPage(1); }} />
                  {cat}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Price Range</h4>
              <input type="range" min="0" max="10000" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} />
              <div className="price-range">
                <span>₹0</span>
                <span>₹{priceRange.toLocaleString()}+</span>
              </div>
            </div>

            <div className="filter-section">
              <h4>Rating</h4>
              {[
                { min: 5, label: "★★★★★ 5 stars only" },
                { min: 4, label: "★★★★☆ 4 & above" },
                { min: 3, label: "★★★☆☆ 3 & above" },
                { min: 2, label: "★★☆☆☆ 2 & above" },
              ].map((r) => (
                <label key={r.min}>
                  <input type="checkbox" checked={selectedRating === r.min} onChange={() => setSelectedRating(selectedRating === r.min ? null : r.min)} />
                  {r.label}
                </label>
              ))}
            </div>

            <button className="apply-filter" onClick={() => setCurrentPage(1)}>Apply Filters</button>
          </div>
        </aside>

        {/* Services Grid */}
        <section className="services-products">
          <div className="products-grid">
            {paginatedServices.map((service) => (
              <div key={service.id} className="product-card">
                <div className="product-img-wrapper">
                  <button className="product-wishlist-btn" onClick={() => handleToggleWishlist(service)}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={wishlisted[service.id] ? "#e63946" : "none"}
                      stroke={wishlisted[service.id] ? "#e63946" : "#666"}
                      strokeWidth="1.8"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <img src={service.img} alt={service.name} className="product-img" />
                </div>
                <div className="product-info">
                  <p className="product-name">{service.name}</p>
                  <p className="product-seller">{service.seller?.store_name}</p>
                  <div className="product-meta">
                    <span className="product-price">₹{Number(service.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <button className="product-add-to-cart-btn" onClick={() => handleAddToCart(service)}>
                    📋 Book Now
                  </button>
                  <Link href={`/services/${service.slug}`} className="product-details-btn">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹ Prev</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`page-btn ${currentPage === i + 1 ? "active" : ""}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next ›</button>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="services-right">
          <div className="card">
            <div className="card-title">
              <h3>Explore on Map</h3>
              <button onClick={() => window.location.href = '/business'}>View Full Map →</button>
            </div>
            <div className="map-image">
              <div ref={(el) => {
                if (!el) return;
                const loadMap = () => {
                  if (!window.google) return;
                  new window.google.maps.Map(el, {
                    center: { lat: 22.5726, lng: 88.3639 },
                    zoom: 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                  });
                };
                if (window.google) {
                  loadMap();
                } else if (!document.getElementById("google-maps-script")) {
                  const script = document.createElement("script");
                  script.id = "google-maps-script";
                  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}`;
                  script.async = true;
                  script.defer = true;
                  script.onload = loadMap;
                  document.head.appendChild(script);
                } else {
                  document.getElementById("google-maps-script").addEventListener("load", loadMap);
                }
              }} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="map-legend">
              <div className="legend-item"><img src="/images/maplogo1.png" alt="" /><span>Handicrafts</span></div>
              <div className="legend-item"><img src="/images/maplogo2.png" alt="" /><span>Local Food</span></div>
              <div className="legend-item"><img src="/images/maplogo3.png" alt="" /><span>Organic</span></div>
              <div className="legend-item"><img src="/images/maplogo4.png" alt="" /><span>Clothing</span></div>
              <div className="legend-item"><img src="/images/maplogo5.png" alt="" /><span>Home Decor</span></div>
              <div className="legend-item"><img src="/images/maplogo6.png" alt="" /><span>Other Shops</span></div>
            </div>
          </div>

          <div className="card support-card">
            <div className="support-content">
              <div className="support-left">
                <h3>Need a Service?</h3>
                <p>Find trusted local service providers near you.</p>
              </div>
              <div className="support-right">
                <img src="/images/support_local.png" alt="Support" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {selectedService && (
        <div className="details-overlay" onClick={() => setSelectedService(null)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="details-close-btn"
              onClick={() => setSelectedService(null)}
              aria-label="Close details"
            >
              ✕
            </button>

            <img
              src={selectedService.img}
              alt={selectedService.name}
              className="details-img"
            />

            <div className="details-body">
              <h2 className="details-name">{selectedService.name}</h2>
              <p className="details-seller">
                By {selectedService.seller?.store_name}
                {selectedService.verified && (
                  <img src="/images/verified.png" alt="" className="details-verified-icon" />
                )}
              </p>

              <h3 className="details-section-title">About This Service</h3>
              <p className="details-about">
                {selectedService.name} offered by {selectedService.seller?.store_name}, a trusted local
                provider in the {selectedService.category} category. Book with confidence —
                every service on Geoinformaticx is backed by verified local professionals.
              </p>

              <div className="details-price-row">
                <span className="details-price-label">Price</span>
                <span className="details-price-value">₹{Number(selectedService.price || 0).toLocaleString("en-IN")}</span>
              </div>

              <button
                className="details-book-btn"
                onClick={async () => {
                  await handleAddToCart(selectedService);
                  setSelectedService(null);
                }}
              >
                📋 Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}