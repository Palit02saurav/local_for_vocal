"use client";

import "./shop.css";
import Filter from "@/components/filter/filter";
import { addToCart } from "@/lib/cart";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function Shop() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shopMapRef = useRef(null);

  const handleAddToCart = async (product) => {
    const result = await addToCart({ productId: product.id, type: "product" });
    if (result.requiresLogin) {
      router.push("/login?redirect=/shop");
    }
  };

  useEffect(() => {
    const loadMap = () => {
      if (!window.google || !shopMapRef.current) return;
      new window.google.maps.Map(shopMapRef.current, {
        center: { lat: 22.5726, lng: 88.3639 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
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
  }, []);

  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 9;

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setCurrentPage(1);
    }
  }, [categoryParam]);

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [priceRange, setPriceRange] = useState(10000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [localArtisans, setLocalArtisans] = useState(false);
  const [homeBusinesses, setHomeBusinesses] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("Popularity");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlisted, setWishlisted] = useState({});
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);

  const handleClearAll = () => {
    setSelectedCategory("All Categories");
    setPriceRange(10000);
    setVerifiedOnly(false);
    setLocalArtisans(false);
    setHomeBusinesses(false);
    setSelectedRating(null);
    setInStockOnly(false);
    setCurrentPage(1);
  };

  const handleApply = () => setCurrentPage(1);

  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/products/public`)
      .then((res) => {
        const products = (res.data.data?.products || []).map((p) => ({
          ...p,
          slug: p.sku,
          rating: p.rating ?? 4.7,
          reviews: p.reviews ?? 0,
          distance: p.distance ?? "Nearby",
          verified: p.verified ?? false,
          img: p.image_url || "https://placehold.co/300x300?text=No+Image",
        }));
        setAllProducts(products);
      })
      .catch((err) => console.error("Failed to load products:", err));
  }, []); 

  useEffect(() => {
    const syncWishlist = async () => {
      const list = await getWishlist();
      const map = {};
      list.forEach((item) => {
        map[item.id] = item.wishlistItemId; // productId -> wishlistItemId
      });
      setWishlisted(map);
    };
    syncWishlist();
    window.addEventListener("storage", syncWishlist);
    return () => window.removeEventListener("storage", syncWishlist);
  }, []);

  const handleToggleWishlist = async (product) => {
    if (wishlisted[product.id]) {
      await removeFromWishlist(wishlisted[product.id]);
    } else {
      const result = await addToWishlist({ productId: product.id, type: "product" });
      if (result.requiresLogin) {
        router.push("/login?redirect=/shop");
        return;
      }
    }
    const list = await getWishlist();
    const map = {};
    list.forEach((item) => {
      map[item.id] = item.wishlistItemId;
    });
    setWishlisted(map);
  };

  const filteredProducts = allProducts
    .filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== "All Categories" && p.category !== selectedCategory) return false;
      if (Number(p.price) > priceRange) return false;
      if (verifiedOnly && !p.verified) return false;
      if (selectedRating && Number(p.rating || 0) < selectedRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Price Low to High") return Number(a.price) - Number(b.price);
      if (sortBy === "Price High to Low") return Number(b.price) - Number(a.price);
      if (sortBy === "Newest") return (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
      if (sortBy === "Popularity") return Number(b.reviews || 0) - Number(a.reviews || 0);
      return 0;
    });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / cardsPerPage));

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="shop-title">
          <h1>Shop</h1>
          <p>
            Discover unique local products from trusted businesses in your
            area.
          </p>
          <div
            className="all-categories-dropdown"
            onMouseEnter={() => setAllCategoriesOpen(true)}
            onMouseLeave={() => setAllCategoriesOpen(false)}
          >
            <button className="all-categories-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              All Categories
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {allCategoriesOpen && (
              <div className="categories-menu">
                {["Handicrafts", "Local Food", "Organic", "Clothing", "Home Decor"].map((cat) => (
                  <button
                    key={cat}
                    className="category-item"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                      setAllCategoriesOpen(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shop-header-right">
          <span className="result-text">
            {filteredProducts.length > 0
              ? `Showing ${(currentPage - 1) * cardsPerPage + 1} - ${Math.min(currentPage * cardsPerPage, filteredProducts.length)} of ${filteredProducts.length} results`
              : "No results found"}
          </span>
          <select
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option>Popularity</option>
            <option>Newest</option>
            <option>Price Low to High</option>
            <option>Price High to Low</option>
          </select>
          <button className="view-btn active">⊞</button>
          <button className="view-btn">☰</button>
        </div>
      </div>

      <div className="shop-content">
        <aside className="shop-filter">
          <Filter
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            priceRange={priceRange} setPriceRange={setPriceRange}
            verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
            localArtisans={localArtisans} setLocalArtisans={setLocalArtisans}
            homeBusinesses={homeBusinesses} setHomeBusinesses={setHomeBusinesses}
            selectedRating={selectedRating} setSelectedRating={setSelectedRating}
            inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
            onClearAll={handleClearAll}
            onApply={handleApply}
          />
        </aside>
        <section className="shop-products">
          <div className="products-grid">
            {paginatedProducts.map((product) => (
              <div key={product.name} className="product-card">
                <div className="product-img-wrapper">
                  {product.badge && (
                    <span className={`product-badge ${product.badge === "Bestseller" ? "badge-orange" : "badge-green"}`}>
                      {product.badge}
                    </span>
                  )}
                  <button
                    className="product-wishlist-btn"
                    aria-label="Add to wishlist"
                    onClick={() => handleToggleWishlist(product)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={wishlisted[product.id] ? "#e63946" : "none"}
                      stroke={wishlisted[product.id] ? "#e63946" : "#666"}
                      strokeWidth="1.8"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <img src={product.img} alt={product.name} className="product-img" />
                </div>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-seller">
                    {product.seller?.store_name}
                    <img src="/images/verified.png" alt="" className="product-verified-icon" />
                  </p>
                  <div className="product-meta">
                   <span className="product-price">₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
                    <span className="product-rating">⭐ {product.rating} ({product.reviews})</span>
                  </div>
                  <p className="product-distance">📍 {product.distance}</p>
                  <button
                    className="product-add-to-cart-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    🛒 Add to Cart
                  </button>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="product-details-btn"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next ›
            </button>
          </div>
        </section>

        <aside className="shop-right">
          <div className="card">
            <div className="card-title">
              <h3>Explore on Map</h3>
              <button onClick={() => window.location.href = '/business'}>View Full Map →</button>
            </div>

            <div className="map-image">
              <div ref={shopMapRef} style={{ width: "100%", height: "100%" }} />
            </div>

            <div className="map-legend">
              <div className="legend-item">
                <img src="/images/maplogo1.png" alt="" />
                <span>Handicrafts</span>
              </div>
              <div className="legend-item">
                <img src="/images/maplogo2.png" alt="" />
                <span>Local Food</span>
              </div>
              <div className="legend-item">
                <img src="/images/maplogo3.png" alt="" />
                <span>Organic</span>
              </div>
              <div className="legend-item">
                <img src="/images/maplogo4.png" alt="" />
                <span>Clothing</span>
              </div>
              <div className="legend-item">
                <img src="/images/maplogo5.png" alt="" />
                <span>Home Decor</span>
              </div>
              <div className="legend-item">
                <img src="/images/maplogo6.png" alt="" />
                <span>Other Shops</span>
              </div>
            </div>
          </div>

          <div className="card featured-card">
            <h3 className="featured-title">Featured Local Business</h3>
            <div className="featured-image">
              <img src="/images/featurelocal.png" alt="Pottery" />
            </div>
            <div className="featured-content">
              <div className="business-name">
                <h4>Earthy Hands Pottery</h4>
                <img src="/images/verified.png" alt="Verified" className="verified-icon" />
              </div>
              <div className="business-info">
                <div className="info-item">⭐<span>4.8 (120)</span></div>
                <div className="info-item">📍<span>1.2 km away</span></div>
              </div>
              <p className="business-desc">
                Beautiful hand-crafted terracotta products made with love and tradition.
              </p>
              <button className="view-store-btn">View Store</button>
            </div>
          </div>

          <div className="card support-card">
            <div className="support-content">
              <div className="support-left">
                <h3>Support Local</h3>
                <p>
                  Every purchase you make
                  helps local artisans and
                  small businesses grow.
                </p>
              </div>
              <div className="support-right">
                <img src="/images/support_local.png" alt="Support Local" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {selectedProduct && (
        <div className="details-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="details-close-btn"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close details"
            >
              ✕
            </button>
            <img src={selectedProduct.img} alt={selectedProduct.name} className="details-img" />
            <div className="details-body">
              <h2 className="details-name">{selectedProduct.name}</h2>
              <p className="details-seller">
                By {selectedProduct.seller?.store_name}
                {selectedProduct.verified && (
                  <img src="/images/verified.png" alt="" className="details-verified-icon" />
                )}
              </p>
              <div className="details-meta">
                <span className="details-rating">⭐ {selectedProduct.rating} ({selectedProduct.reviews} reviews)</span>
                <span className="details-distance">📍 {selectedProduct.distance}</span>
              </div>
              <h3 className="details-section-title">About This Product</h3>
              <p className="details-about">
                {selectedProduct.name} from {selectedProduct.seller?.store_name}, a trusted local
                seller in the {selectedProduct.category} category. Every purchase supports
                local artisans and small businesses in your community.
              </p>
              <div className="details-price-row">
                <span className="details-price-label">Price</span>
                <span className="details-price-value">₹{Number(selectedProduct.price || 0).toLocaleString("en-IN")}</span>
              </div>
              <button
                className="details-book-btn"
                onClick={async () => {
                  await handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}