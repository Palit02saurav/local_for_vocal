"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { addToWishlist, removeFromWishlist, isWishlisted } from "@/lib/wishlist";
import { findDistrictSpecialty, productMatchesSpecialty } from "@/lib/districtSpecialties";
import "./Homepage.css";
import axios from "axios";


const API_BASE = process.env.NEXT_PUBLIC_API_URL;  

function WishlistCard({ item, onViewDetails, type = "product" }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(isWishlisted(item.name));
  }, [item.name]);
  
  const toggleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(item.name);
      setWishlisted(false);
    } else {
      addToWishlist(item);
      setWishlisted(true);
    }
  };

  const handleAddToCart = async () => {
    const result = await addToCart({ productId: item.id, type });
    if (result.requiresLogin) {
      router.push(`/login?redirect=/`);
    } else if (!result.success) {
      console.error("Add to cart failed:", result.message);
    }
  };
  return (
    <div className="product-card">
      <div className="product-img-wrapper">
        {item.badge && (
          <span className={`product-badge ${item.badge === "Bestseller" ? "badge-orange" : "badge-green"}`}>
            {item.badge}
          </span>
        )}
        {item.district && (
          <span className="district-tooltip">Famous in {item.district}</span>
        )}
        <button className="wishlist-btn" onClick={toggleWishlist} aria-label="Toggle wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "#e74c3c" : "none"} stroke={wishlisted ? "#e74c3c" : "#666"} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <img src={item.img} alt={item.name} className="product-img" />
      </div>
      <div className="product-info">
        <p className="product-name">{item.name}</p>
        <p className="product-seller">By {item.seller}</p>
        <div className="product-meta">
          <span className="product-price">{item.price}</span>
          <span className="product-rating">⭐ {item.rating} ({item.reviews})</span>
        </div>
        {/* <button
          className="add-to-cart-btn"
          onClick={() =>
            addToCart({
              id: item.name,
              name: item.name,
              seller: item.seller,
              verified: item.verified || false,
              price:
                typeof item.price === "number"
                  ? item.price
                  : Number(String(item.price).replace(/[^0-9.]/g, "")),
              image: item.img,
              type,
            })
          }
        >
          {type === "service" ? "📋 Book Now" : "🛒 Add to Cart"}
        </button> */}

        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          {type === "service" ? "📋 Book Now" : "🛒 Add to Cart"}
        </button>
        <Link
          href={type === "service" ? `/services/${item.slug}` : `/shop/${item.slug}`}
          className="product-details-btn"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
export default function HomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;
  const [selectedItem, setSelectedItem] = useState(null);

const [liveProducts, setLiveProducts] = useState([]);
const [liveServices, setLiveServices] = useState([]);
const [regionalProducts, setRegionalProducts] = useState([]);
const [productsLoading, setProductsLoading] = useState(true);
const [servicesLoading, setServicesLoading] = useState(true);
const [liveSellers, setLiveSellers] = useState([]);
const [sellersLoading, setSellersLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/products/public`);
        const rawProducts = data.data?.products || [];
        const products = rawProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.sku,
          seller: p.seller?.store_name || p.seller?.full_name || "Geoinformaticx",
          price: `₹${Number(p.price).toLocaleString("en-IN")}`,
          rating: 4.7,
          reviews: 0,
          badge: null,
          img: p.image_url || "https://placehold.co/300x300?text=No+Image",
        }));
        setLiveProducts(products);

        const regional = rawProducts
          .filter((p) => p.product_type === "Regional Famous")
          .map((p) => {
            const specialty = findDistrictSpecialty(p.seller?.location);
            return {
              id: p.id,
              name: p.name,
              slug: p.sku,
              seller: p.seller?.store_name || p.seller?.full_name || "Geoinformaticx",
              price: `₹${Number(p.price).toLocaleString("en-IN")}`,
              rating: 4.7,
              reviews: 0,
              badge: "Regional Specialty",
              district: specialty?.district || p.seller?.location || null,
              img: p.image_url || "https://placehold.co/300x300?text=No+Image",
            };
          });
        setRegionalProducts(regional);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setProductsLoading(false);
      }
    };

    const loadServices = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/services/public`);
        const services = (data.data?.services || []).map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.sku,
          seller: s.seller?.store_name || s.seller?.full_name || "Geoinformaticx",
          price: `₹${Number(s.price).toLocaleString("en-IN")}`,
          rating: 4.7,
          reviews: 0,
          badge: null,
          img: s.image_url || "https://placehold.co/300x300?text=No+Image",
        }));
        setLiveServices(services);
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setServicesLoading(false);
      }
    };

const loadSellers = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/sellers/public`);
    const sellers = (data.data?.sellers || []).map((s) => ({
      id: s.id,
      name: s.store_name || s.full_name || "Local Store",
      location: s.location || "",
      img: `https://picsum.photos/seed/store-${s.id}/300/300`,
    }));
    setLiveSellers(sellers);
  } catch (err) {
    console.error("Failed to load sellers:", err);
  } finally {
    setSellersLoading(false);
  }
};

loadProducts();
loadServices();
loadSellers();
}, []);

  // const [liveProducts, setLiveProducts] = useState([]);
  // const [liveServices, setLiveServices] = useState([]);

  // useEffect(() => {
  //   const loadProducts = async () => {
  //     try {
  //       const res = await fetch(`${API_BASE}/products/public`);
  //       const data = await res.json();
  //       const products = (data.data?.products || []).map((p) => ({
  //         name: p.name,
  //         slug: p.sku,
  //         seller: p.seller?.store_name || p.seller?.full_name || "Geoinformaticx",
  //         price: `₹${Number(p.price).toLocaleString("en-IN")}`,
  //         rating: 4.7,
  //         reviews: 0,
  //         badge: null,
  //         img: p.image_url || "https://placehold.co/300x300?text=No+Image",
  //       }));
  //       setLiveProducts(products);
  //     } catch (err) {
  //       console.error("Failed to load products:", err);
  //     }
  //   };

  //   const loadServices = async () => {
  //     try {
  //       const res = await fetch(`${API_BASE}/services/public`);
  //       const data = await res.json();
  //       const services = (data.data?.services || []).map((s) => ({
  //         name: s.name,
  //         slug: s.sku,
  //         seller: s.seller?.store_name || s.seller?.full_name || "Geoinformaticx",
  //         price: `₹${Number(s.price).toLocaleString("en-IN")}`,
  //         rating: 4.7,
  //         reviews: 0,
  //         badge: null,
  //         img: s.image_url || "https://placehold.co/300x300?text=No+Image",
  //       }));
  //       setLiveServices(services);
  //     } catch (err) {
  //       console.error("Failed to load services:", err);
  //     }
  //   };

  //   loadProducts();
  //   loadServices();
  // }, []);
 

  const [prodAtStart, setProdAtStart] = useState(true);
  const [prodAtEnd, setProdAtEnd] = useState(false);
  const [regAtStart, setRegAtStart] = useState(true);
  const [regAtEnd, setRegAtEnd] = useState(false);
  const [bizAtStart, setBizAtStart] = useState(true);
  const [bizAtEnd, setBizAtEnd] = useState(false);
  const [servAtStart, setServAtStart] = useState(true);
  const [servAtEnd, setServAtEnd] = useState(false);

  const handleServScroll = (e) => {
    const el = e.target;
    setServAtStart(el.scrollLeft <= 0);
    setServAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  };


  const [heroSearch, setHeroSearch] = useState("");
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);

  const heroSuggestions = [
    "Handicrafts", "Handmade Tribal Bag", "Handwoven Wall Hanging", "Handmade Herbal Soap",
    "Organic Wild Honey", "Organic Spices", "Organic Cotton",
    "Local Food", "Local Artisans", "Local Businesses",
    "Terracotta Cooking Pot", "Masala Tea Blend", "Bamboo Craft Set",
    "Wooden Jewellery Box", "Clothing", "Home Decor",
  ];

  const filteredHeroSuggestions = heroSearch.trim().length > 0
    ? heroSuggestions.filter((s) =>
        s.toLowerCase().includes(heroSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleHeroSuggestionClick = (s) => {
    setHeroSearch(s);
    setShowHeroSuggestions(false);
    router.push(`/shop?q=${encodeURIComponent(s)}`);
  };

  const handleProdScroll = (e) => {
    const el = e.target;
    setProdAtStart(el.scrollLeft <= 0);
    setProdAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  };

  const handleRegScroll = (e) => {
    const el = e.target;
    setRegAtStart(el.scrollLeft <= 0);
    setRegAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  };

  const handleBizScroll = (e) => {
    const el = e.target;
    setBizAtStart(el.scrollLeft <= 0);
    setBizAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  };

  const popularSearches = ["Handicrafts", "Organic", "Handmade", "Local Food"];

  return (
    <main>
      <section className="hero">
        
        <div className="hero-left">
          <h1 className="hero-heading">
            Discover Local.<br />
            <span className="hero-heading-green">Support Local.</span>
          </h1>
          <p className="hero-subtext">
            Find special products and unique businesses<br />
            from your local community.
          </p>
          <div className="hero-search-bar" style={{ position: "relative" }}>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search products, businesses..."
              value={heroSearch}
              onChange={(e) => {
                setHeroSearch(e.target.value);
                setShowHeroSuggestions(true);
              }}
              onFocus={() => setShowHeroSuggestions(true)}
              onBlur={() => setTimeout(() => setShowHeroSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && heroSearch.trim()) {
                  setShowHeroSuggestions(false);
                  router.push(`/shop?q=${encodeURIComponent(heroSearch.trim())}`);
                }
                if (e.key === "Escape") {
                  setShowHeroSuggestions(false);
                  setHeroSearch("");
                }
              }}
              autoComplete="off"
            />
            <button
              className="hero-search-btn"
              onClick={() => {
                if (heroSearch.trim()) {
                  setShowHeroSuggestions(false);
                  router.push(`/shop?q=${encodeURIComponent(heroSearch.trim())}`);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            {showHeroSuggestions && filteredHeroSuggestions.length > 0 && (
              <div className="hero-search-suggestions">
                {filteredHeroSuggestions.map((s) => (
                  <div
                    key={s}
                    className="hero-suggestion-item"
                    onMouseDown={() => handleHeroSuggestionClick(s)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-ctas">
            <Link href="/shop" className="btn-primary">Shop Now</Link>
            <Link href="/shop" className="btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Explore Businesses
            </Link>
          </div>
          <div className="hero-popular">
            <span className="popular-label">Popular Searches:</span>
            {popularSearches.map((term, i) => (
              <span key={term}>
                <Link href={`/shop?q=${term.toLowerCase()}`} className="popular-link">{term}</Link>
                {i < popularSearches.length - 1 && <span className="popular-dot"> • </span>}
              </span>
            ))}
          </div>
        </div>

        {/* Right Images - diagonal panels */}
        <div className="hero-right">
          <div className="hero-panels">
            <div className="hero-panel panel-1">
              <img
                src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/0002e0158d58e0a0ae0f389bae072984.png"
                alt="Pottery craftsman"
              />
            </div>
            <div className="hero-panel panel-2">
              <img
                src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/452384b5efee555f144495d5a830803d.png"
                alt="Local spices and jars"
              />
            </div>
            <div className="hero-panel panel-3">
              <img
                src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/25fa2f7b6908cadf1c448a9b7b48aaa8.png"
                alt="Local textiles"
              />
            </div>
          </div>

          <div className="hero-map-card">
            <div className="map-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="map-card-text">
              <p className="map-card-title">Explore businesses<br />near you</p>
              <Link href="/business" className="map-card-link">
                View on Map →
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>


      {/* <section className="categories-section">
        <div className="categories-header">
          <h2 className="categories-title">Shop by Category</h2>
          <Link href="/shop" className="categories-view-all">View All Categories →</Link>
        </div>
        <div className="categories-grid">
          {[
            { label: "Handicrafts", emoji: "🏺" },
            { label: "Local Food", emoji: "🥗" },
            { label: "Clothing", emoji: "👕" },
            { label: "Organic", emoji: "🌿" },
            { label: "Art & Decor", emoji: "🏮" },
            { label: "Traditional", emoji: "🥁" },
            { label: "Agriculture", emoji: "🌱" },
            { label: "Regional Specialties", emoji: "🎁" },
            { label: "Services", emoji: "⚙️" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={`/shop?category=${cat.label.toLowerCase().replace(/ /g, "-")}`}
              className="category-card"
            >
              <div className="category-icon-box">
                <span className="category-emoji">{cat.emoji}</span>
              </div>
              <span className="category-card-label">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section> */}


      {!productsLoading && regionalProducts.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Regional Specialties</h2>
          </div>
          <div className="scroll-container">
            {!regAtStart && <button className="scroll-btn scroll-left" onClick={() => document.getElementById('regional-grid').scrollBy({left: -700, behavior: 'smooth'})}>‹</button>}
            <div className="products-grid" id="regional-grid" onScroll={handleRegScroll}>
              {regionalProducts.map((product) => (
                <WishlistCard key={product.slug || product.name} item={product} onViewDetails={setSelectedItem} />
              ))}
            </div>
            {!regAtEnd && <button className="scroll-btn scroll-right" onClick={() => document.getElementById('regional-grid').scrollBy({left: 700, behavior: 'smooth'})}>›</button>}
          </div>
        </section>
      )}  

      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Products</h2>
          <Link href="/shop" className="section-view-all">View All Products →</Link>
        </div>
        <div className="scroll-container">
          {!prodAtStart && <button className="scroll-btn scroll-left" onClick={() => document.getElementById('products-grid').scrollBy({left: -700, behavior: 'smooth'})}>‹</button>}
          <div className="products-grid" id="products-grid" onScroll={handleProdScroll}>
          {productsLoading ? (
            <p style={{ padding: "20px", color: "#888" }}>Loading products…</p>
          ) : liveProducts.length === 0 ? (
            <p style={{ padding: "20px", color: "#888" }}>No products listed yet.</p>
          ) : (
            liveProducts.map((product) => (
              <WishlistCard key={product.slug || product.name} item={product} onViewDetails={setSelectedItem} />
            ))
          )}
          </div>
          {!prodAtEnd && <button className="scroll-btn scroll-right" onClick={() => document.getElementById('products-grid').scrollBy({left: 700, behavior: 'smooth'})}>›</button>}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Services</h2>
          <Link href="/shop?category=services" className="section-view-all">View All Services →</Link>
        </div>
        <div className="scroll-container">
          {!servAtStart && <button className="scroll-btn scroll-left" onClick={() => document.getElementById('services-grid').scrollBy({left: -700, behavior: 'smooth'})}>‹</button>}
          <div className="products-grid" id="services-grid" onScroll={handleServScroll}>
          {servicesLoading ? (
            <p style={{ padding: "20px", color: "#888" }}>Loading services…</p>
          ) : liveServices.length === 0 ? (
            <p style={{ padding: "20px", color: "#888" }}>No services listed yet.</p>
          ) : (
            liveServices.map((service) => (
              <WishlistCard key={service.slug || service.name} item={service} onViewDetails={setSelectedItem} type="service" />
            ))
          )}
          </div>
          {!servAtEnd && <button className="scroll-btn scroll-right" onClick={() => document.getElementById('services-grid').scrollBy({left: 700, behavior: 'smooth'})}>›</button>}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Local Businesses Near You</h2>
          <Link href="/business" className="section-view-all">View All Businesses →</Link>
        </div>
        <div className="scroll-container">
          {!bizAtStart && <button className="scroll-btn scroll-left" onClick={() => document.getElementById('businesses-grid').scrollBy({left: -700, behavior: 'smooth'})}>‹</button>}
          <div className="businesses-grid" id="businesses-grid" onScroll={handleBizScroll}>
            {sellersLoading ? (
              <p className="biz-empty-msg">Loading businesses...</p>
            ) : liveSellers.length === 0 ? (
              <p className="biz-empty-msg">No local businesses yet.</p>
            ) : (
              liveSellers.map((biz) => (
                <div key={biz.id} className="business-card">
                  <img src={biz.img} alt={biz.name} className="business-img" />
                  <div className="business-info">
                    <p className="business-name">{biz.name}</p>
                    <p className="business-location">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {biz.location}
                    </p>
                    <Link href={`/store/${biz.id}`} className="view-store-btn">View Store</Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {!bizAtEnd && <button className="scroll-btn scroll-right" onClick={() => document.getElementById('businesses-grid').scrollBy({left: 700, behavior: 'smooth'})}>›</button>}
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-card">
          <div className="trust-icon-svg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="trust-title">Support Local Businesses</p>
            <p className="trust-desc">Empower local artisans and entrepreneurs</p>
          </div>
        </div>
        <div className="trust-divider" />
        <div className="trust-card">
          <div className="trust-icon-svg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
            </svg>
          </div>
          <div>
            <p className="trust-title">Quality Products</p>
            <p className="trust-desc">Handpicked, high-quality local products</p>
          </div>
        </div>
        <div className="trust-divider" />
        <div className="trust-card">
          <div className="trust-icon-svg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="trust-title">Secure Payments</p>
            <p className="trust-desc">Safe and secure payment options</p>
          </div>
        </div>
        <div className="trust-divider" />
        <div className="trust-card">
          <div className="trust-icon-svg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <p className="trust-title">Fast Delivery</p>
            <p className="trust-desc">Quick delivery to your doorstep</p>
          </div>
        </div>
      </section>

      {selectedItem && (
        <div className="details-overlay" onClick={() => setSelectedItem(null)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="details-close-btn"
              onClick={() => setSelectedItem(null)}
              aria-label="Close details"
            >
              ✕
            </button>

            <img
              src={selectedItem.img}
              alt={selectedItem.name}
              className="details-img"
            />

            <div className="details-body">
              <h2 className="details-name">{selectedItem.name}</h2>
              <p className="details-seller">By {selectedItem.seller}</p>

              <div className="details-meta">
                <span className="details-rating">⭐ {selectedItem.rating} ({selectedItem.reviews} reviews)</span>
              </div>

              <h3 className="details-section-title">About This Item</h3>
              <p className="details-about">
                {selectedItem.name} offered by {selectedItem.seller}. Every purchase
                supports local artisans and small businesses in your community.
              </p>

              <div className="details-price-row">
                <span className="details-price-label">Price</span>
                <span className="details-price-value">{selectedItem.price}</span>
              </div>

              <button
                className="details-book-btn"
                onClick={async () => {
                  const result = await addToCart({
                    productId: selectedItem.id,
                    type: selectedItem.type || "product",
                  });
                  if (result.requiresLogin) {
                    router.push(`/login?redirect=/`);
                    return;
                  }
                  setSelectedItem(null);
                }}
              >
                {selectedItem.type === "service" ? "📋 Book Now" : "🛒 Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}