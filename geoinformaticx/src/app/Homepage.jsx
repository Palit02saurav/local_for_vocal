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

    loadProducts();
    loadServices();
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
          {[
            { name: "Crafts of Odisha", location: "Bhubaneswar, Odisha", rating: 4.8, reviews: 150, img: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJYAtAMBEQACEQEDEQH/xAAbAAACAgMBAAAAAAAAAAAAAAAEBQMGAQIHAP/EADoQAAIBAgQEBAQEBQMFAQAAAAECAwQRAAUSIRMxQVEGImFxFDKBkRUjobFCUmLR4SQzwQdysvDxov/EABsBAAIDAQEBAAAAAAAAAAAAAAIEAQMFAAYH/8QAOBEAAgIBAwIEAwYFAwUBAAAAAQIAAxEEEiExQQUTUWEicZEjMoGhwfAUQrHR8QYV4TM0UmKSJP/aAAwDAQACEQMRAD8Ad1lR8NSrBStVvJb5wWCj6cv0x5ejU6otuZsD0npaaVdtzYxBZsoy/wARU0UFYuqRRZ7i0kf9SEW27jf64YTxGyt8W/d9RKtVpwM8fIyl53/09zWiSaagPxkEZN1K6JLDrY7Ee32w5X4lp7H25me+nIxt5lLkDRyMkiMjqbMrCxB9R0w/FjkHBmmrHTszHlJ5g46dMjnjp02Juox06Yu1/fHSZi/fHTp4sBy5Y6dDZnvlFMe0jjFYHxmOWn/8qD3MA1D2xZE5nVYYjE6Tx10qbatQ/lffAlBDDsIfT5nFIioyhCo5HcHFZQy0Wg9ZKWil3uQOdw1x/fA4IhbgZshdVuDrUdQb4nMgrmTfGBqdoJhqhPMH++JDESpq1ip6aIkPTnire6heg7HBlzBCQpqeVnd9lVLBUI2tzxKcwHGIzWpFVRIysVKeRlx0kSAmOkJi4RfrcY6dLJk1LHPVwmsfgI7co/KEH0xm6q4qp8sdJt6bw8pT5lnxNiW2ry2hgJp6XNqqKqCl1Es2pCB0F9v+cIedlFcrnPBGOkBUduduB7RQarOaeiNTOzTULm2vRYKPULbb1vhqurS2WbVGGi2rGp0xzWQ2PrF2a5ZRZzADVQKsoAC1MDaWXsLNcMPQt35Yfrrsq+6cj3mQ3i9d3/VTBnP83ymoyqp4U9mRv9uVRZXH/B9P354bDZGYaOjjKnMAI6g4mHNdRxxnTcE257YiTPXtzx06eLDHTp7yt0+2OnQyQn8JgHaZ/wBhgB98xp/+3T5mBNsSbbYOKzFx2x06a7dDjp0xcjHTplZGQ3UkH0OOInZhUWYyqQW39tjgNkMWEQr45J0N7auVm2P3wO0iGHBktDGq/wC0bMel8C2YSxmxJh0sPNeze2ABweIW0HrIoljhfUuyki4vzwYeVmvjiNVqqJhd1N/bBboGwiPPCsVJmOYrS5hKYXVTdRa7n0xmav7Dlvu+s3NP4oL9ILKeWHUeksGYQpkCulO8dTFVArplUaksP8/thFjXqbPgJAXoemZbQTqsb+CPSEtFWZLlKzERSxTQhXMmzRgjlztbFlZsFuUON3THf+xlJenUWkNxtMX+E6Osgyt5GslLVMUU6AzqN7OoOx08yO2PS1ggDM8beANS7oPgJgFdRpW09VQ5jTwLw3vLw9oW2ujIbkpcG43se99sQV54hnS2Inn0cjuJzHxBk0+S1xhk1NC92hkYfMAbEH+oHYjv6EY6N12eYgcRXe+Oh5mCfXHGdM6tt8RiTMasdidmYDEkWvc8rY6dHwynMnySIpRzEmYuBax0252PqMAPvR1hnTgDqDE0ySxERzxvE4/hkUqbexweImcjgyEm3PHYkZntWOxOzPFh3x2JOZ4ae+OxOzM9MROnrYnM7E2jlkjN0YqfQ4EjMIEiO6HMJjQzTP52QgH2xUy84EtVz3k0WZUs5AayH1GBKEQhYIQIo28yybHscDzD4MZVWuatpoIRaS+vVbcL6e+LbCAhzMb/AE7RY2p3I2MS/U3hyJ6OnaMziTQROqJqZJOgK8xjMvDLWGrXnPInsm8RZbGBxjPHyg9Vlz/imX5ZmtXOtPLTB4owR5JOWlgTyxo6fT1pg45MwPE9UxyV4UnGRD3qqDJ6mehXMK+N0F2SKG9htv2ubAhh+mHNoWY6aSw5CEzWLMMqSSGP8SgnnUGH80sjSQkkgWbY2JH/AOh2wWI/4ctlH2VnebeJfCq5jl4pzoKMQY2ZrtTuwOk77lSfL6An0tBxLvLG4hR/mcchyuJp3gqUMUqMVYHYgjHYBizEgzNf4dWGPiQzEjscdsEgWGJ3oJ0vtcYAjEPMOy7w9U1YL1MkdLEFLXk+ZvYf3xS1yg4HMuFZxk8CW7w/k1BSktRRpVVKglppN1QAXNtrXsMLWPe3CDiX1/w6nlpakjop6hYYZZIKlTaRIWuT1I08wbA/bC1L3Hi1SPcAxkXooIBBkdZmeSV4WFRQT0tirI8qXI7gk3v9cVm3VhicEDsMSKhUwOWGYgzTwHlFahkyqt+Hci6qx1IPf/B+hxdVr3/nXmBbps9OJz3Ncoq8rqDDWR6Teyuu6t7HGlXatgysSsqes4aBGPbmcWZlcyE9cRmTibKSDjjOmSSGscRiTPX6Y6TmMqJmGVVoXlcXxWfviWL90xbfByubCRwLBmH1x2JOZf6n8tVmQstQjWiK8yb8vbANgg5mL4RdempAp6mXTKJ6xjCtRGHYTapZRIVdiynylh7XxmLrVQ8z6BqKqwpPTjp249JpHMfElbTo1PFT8IsqTO5LO2mxBPQEj9cbCoonh/ENT57+SDGtGZJkWAq7VtEDwVTQAybBlYnny237YNYPhWrNdgRvlHcFBTZnRlphG1Owv5kuCLXuMWE8TfttKPgcmKK+RTUCKGfWIkCCZTu45gkdxffvzxX1jtSHaWYYz2nOfHNMtPmUOZxABanyTaTsJF5fcf8AicQrDpM/XUbDuA4MUy10ctNw1N37YMnAmaF5gtIJWJMQBIJGrpexNh67HFJJaXgHOB1h70bcOoWWqjV41WRleM3C3ILAmx7bDc3ta4xwUKIFqWng9TLLHkXxOVtCJXhVB/prHTpfmJGsASSQSAblQxGD2ZEfo0gVfj6zbL8zglrOLNUSQVdSFiqsvgQGSSeNgdYvsncMxN9++IJiK6axrNohNR4baqlad6Ki4rgsyieQHWVALarW+YFrabXJGC+KMN4epB+KIc8yf4RpDGjNFHJ5lkUa4wSdIYjyksqk+W49uWBZSRiICs6e0BumZbazIqXO8tpU+DplinUuJKXZXG21tvMNyBz2Ptjz9B1FZbHOM9es3z5DAjqP3zOWeKPDFTkNRfeWjksYp9JAIPIHsca2nvF6ZHXvM2xCjYMQslhcYvBgmRnBwZ69x646dGuU5LPmO+tY16XBJPsMUvaq9TLkpLcmWeh8NxR0rRkPIJTZh1+3TCzalAcxlKwBtMArfBNZwmqKFg8dyNL7fY9cWJqq2HWVWafB+GVypoaullMVRTyxuOhXDGR6xcqROk5DBHU1cldLvTUaEoOjNyH3P7YyvELyoFK9WjfgHhxpq85vvPwPlLTl0cw5SgxrIkz3HzOxsfoMZ5UcEjnpN+4r0I56fhNsryGqhpJZqhoYUeRnh1yDz73t77HbHqUG5QZ8/wBbpGe5mWbhaCkqYXqs2iMgdGhSnXi6he6sAL7bEEWuMEFlFOgfcCTzD6Svlkpq6mrEqaJJmMlNxYgAw56Sq3t2uLcr45jg4nrNPW21LMZK8H9DAJUSYqJJkhDbNIWtYbXt3O/639gfGOZp7igOBn995B4ry6mrsmqssi4BaLWYJh5WlkFyPS17Ke+9uWFkvy2VHw+sz7ansQsc5ODj0/zOO0zLxI9g5ksBdrAX5XwweTiZWdolqyhIaWi+Ic3jA8gB335W3Ox5mx64nIAmhQmFAHUw6Cnpc2zulqJoVggo42llBbVfzbDfqCD9sV79zYMabTtX8ecnoJYjnbxSotJHGIQyizrq1jym57Gzn7Yk2HPEsXRBslzz/mDSxZfFXfjVNTOKziKZoi3l024e3rqW+Asbo3pJo0zKzgn7w6/nHcOcQtU6aimWKIlwWQliLyAKQLdLN9r4MXnvK20bgZVsnj+nMGzikWqzeahZCUem0SSxoG4bX1ITcE/ax3xYG3WECZ2rpe2lWA6xVWJU5BQ0UsaJLRwtashUt5mJLAlT23GobHbthTVaNNQCRw3rKqLbNG4SwfCe/pJPE7wz5REsMEr0MkQ+IhaM2VTpIZWPI2IOx5kHGboA1d7LjHHPzj+oUHTs7cnsZybMKQ0lS8F9Q2KP/Mp5H/3rjXmfncMiZmyeoijEhtvi/bxKQ8JynKdc4aoUNbcJhe9ti9ZfSpY9JZJmaKikljqY0WEWRdFix7YzUO5gpHWaJTapJmKSsrGAMUjGQje3Plvje/2jTdWzMc6+3pDo2zWJCumQKrarAbXv6e2IPhGibvz85H+4Xg5IjyjgqK6EVD8EFufFTc2Fj9L4St8MWtsB4xXriy5KSXKstCR0mVp5DJaSX0Fth9rn6489bduZrz24E9UCtKFgOFGBLEkbyxU1gqxQsIgV/isf8YsrCIWGeSMxMsAW9TzNaeamqI63KcytJSvORGflMZO/Pnzx6PTNmpflPLa20JqCp7yfJaSChrDR1UUcc8QBEyQBeKh5OB77H2wxNFHD1ZUczfPKhqup4CnSsJ8qx7EHuB1HtywBj+jr8tdx7wDLqmOCacluJVPEYIVVNlLEb35dT2wjqnIQqOp4jN9bOq44UHJ59JD4ezOgeXMIDHIY1dUQshIEWyrqKiwJIIuT1GLNPtNe0DpxE/EUsS1MnqM/j3/ScvOVyU+aVsQkERgqHjMxG6aXI2JFhy5739MXDiILVvYse/STwfkpFRLIZYYx+QXFr3G4+u4+2Ki2DgzYopCoDiEUzv8AHQxUemeeYqvBvuSDtft6+5xUchh7xssETc3aMoaSuGYvl1ZU0dBwogzyOdS2sFFt+e36HEFiDhjiD56+WLUBbMKierlrfgzJTzys5IsQkb/xBgxIvueVsV+YzHGQZbuVU8wggfU/SGaXEslLLE0VYhCCB+ZJFuY9CTf+rFuQcjvIDBlDj7vrHmUz0tOklO2t5Hb/AHwPKzk+Y252G2GK2VPhmfqa7Gw44A7SfOaYcaGAgkzScDTcqZEcG6nTc2sNVh/Lhg+szNR9pSYlyHN46OhoKPNqZ1R0aKnqEUsJETkGHQkBrXB2HTcBG6tK2NuPxlelsa/CdzKRmuVpVZBNW0wJkoqi9tXywtfmO91J/Xri7qAZRUCGdPTMWS17zU6ggeXbDNY3QGG0wzLJ0FKtRU08miNdQKHdjvuT9MY96u1mBNmrAqyJrTViypoqlJp0bXHFzuSev05Y1dLoPLIdusztVrBZkL0jGjanApI2fhwTVLLOf4rAXVSexwxq2cSjSKC3MIq6umWqNNTUEGy31IdLKPf2wiTtmqKATtxkwepNVMysZJmAWyjXYqLnY9+u+Ia0yo6HnKidCpeHUUlO/KZ5OLK6H5FPlA+22PJplXYHoBxNt9yOR26CMY1BqGip3tTxypZF2DHYH6bYPny9z/eIPMWJwuW6kGC5V8DHDmLSztHO1SySEjUVW/lKDvcDHp9JxQvynmfEjV5pOfaTozVlN8S6IuZUobTNI/DQrsSWO9yQOR2HPbDQbMu8PW5U32A4P5wCp8QZVnEkU0M1pHQF45Lagw9Bv9RitmHebmkUqpUEGYrqpKTK6iKPRLJIRO+p76RYqoJ7gkG3rjN1r/Gij5xqlDberHgDj9T9Zmm8Mw0XhkV0U8gzCeiZypKm4KaiqjncD7239HKaRWue5iWt1zX6k1kDap4/fvOXZnXRVNdXSEBmNZIb7gsNZ8ykG1uuDY9pTpwePaEUUa5hUJRR1MUKOC/FlFtAA327n0269MVE54E0C5rG/bn2EYTz8LJ6KnNLeOOfQiU0ZaWeUb6jsLAqb8x77WxSga7hTgDvF771oct1ZvoIdleV5nm2X1lMuXPlytPCEmiqFZzG0p4qMydlYG1h8uL10tQHIz85m2a29zkt9OJPm9ZWvntdT/gxFKkqqop5VlkaNDa7RBiWvudgp5C/O8W6Ol/5cfKFRrrqznOf36woxUi/EGfizfkApLZ0ana35Y0sb25KQwuMJZ8qw12c+hm7Va9iK9Yxz09fX8ZJTylqdUOlnIAZQR5+1z/L6DscMh/gx3lrIM57RhXUmY15pK5ZYafgqywqqXVrixJvfe1/MNxfnhtBYwycTJto05ymTKlVQ1FLmFLAin4RKhmalLFmicoRe4uTH5rKzHdi2wvinVndQ3YxLSaQ6fWIgOR2hlKiw55PBIFMOYRny8EnUUa7AdgULH/5ijQW76tvcS3WoKtaH7OPzlGroTTTTwNZSkjxttytt+w/XGtUvEz7sh8TDZkZ6ZadECF13IPTlsPXCtFG+0kngR3UXGqpQOpEloVjaYmf/ZhRpHt1A5jGtYwRMzJRdzYjWrGrLlkr5/h4pbGGkp0ALW5XbvzxmNYz9ZrV6dayMjmQ0wDO06owZtrvzI6YWYH1mrSAx3bcExnFK5S6Lde97YrzLTtBl7oFljiqctRFE7uWdgNlUi/+MeYLruW5jwJZbhitzHj9YwhmEi0xp0/LhCiQjle42xYCAjhzyekVZcbtx5PSJbqM3zJOqSa1Udb8/bHpNEd2nQ+0zk01Ta/LjnaCIRU08uaZlQ5OrpEGV5ZQLlTpAsp78xf2w224jEaudKyHbkZnqkT1WVjKGoUimR34dQsY/LZD86nncHGONWw1IqyMdCPeW36elt1+7sD7yOpkosyyPLI45YV41LCX0kFkka5JJ5cyCb7nkN8XaitW1aJ2wZ2mvuqVtQwJP5Y4jOlp5auTK2rJVhnyVZKaoh58XioqRuPQj/kY0UJC7TM3VIPN8yv7rcj29R+E45mMwmCyKF4UxaTltcnp+nXEPGaR1mtKaZKKSSQxtMJTpSW5AQAHYX6nbrhW0ZGBHa3beR2liy2sosh8MHP8zhkrpquYwxwcTydfm6fwncg9AOuLqE2pEfErs2hB/LLRlNFRJImb5JGtIMwoGLRsSgGylWsCNxc/uLb3sxg8RXzPMTDjJBHPfHpM19ZSZDnWU5DT+HFqKWq0I1SUudRa176TqI+Zrm9jggi4lZ1Fu7IJEX5nBT0XiV6GAKYnC2RmsBqF7E9hz+2MvVoATjtPS6SxrdMHbqIzlFOBTcFY1bgLxDsF1cid9r/3wypDYlFe/LbvWH5PMTrhd14RXUSW+Yjl5iP0AwzU3OBF9UoBDgcxXXmGesq084WKCISOpcAEuWANvLcAX83822Ktc2KWlVZxqqwOvMR+Io5iKIw8RamKdNIa9tlJflvbck+mMnwp/tiPUQPF0LUKw6gyteMHp3zmr4KN/qAk2k7FLqtwfXa33xu2WbEiVS+bYpMr8R01PEjuum2n06/2wxoF+A5geIt9qBGmXqzceonb8p1MTAi5kLdAOp64ZvdAu0xSpWZsr1hFW9WlDTx5knCkiAIubkp0uBjLJ7TdTBXJODmG0SJUTRxmThoxGpzyUdTikkdI87FVJHMNnzQIVj40wRFtGEKgBenLCu92JK9JT5XeXgBocyjipqgGSsh/MkJ373HrbkMeWzuqJYcKeI2fiqJYcKeJIjSCCqpqd/yKV76r3L3OwxcHAZbG6kfSQ2CVdhyw+kXxSNN4lzbhsFVV0knod/8AGPTeF5OlUzNdQNYh/wDX9ZHndRWUjUU1E+meNnkQDZmXTZt/W+3rbDzkgYjjVJawGMkfvEgrs+joacnLqt61JqdgpZSDCX+ZiDvtvscYg8Pbzg7euc+s6x0voJ24Oecegjqlaky+jySGkkuY41SVFXURIGtdrb82FsO2Y/ian+cpsRilvHHY+2O0r8tVNDllRWVdXFWy0lO7xSpEoaGZdVw+jkWtfzbFiN72w+BuGT1iVtoqY1VjA7+59ZzZoz5uBxREgCx3f5DYHfvitmxJQE9TCacxGijj1Fap2eOQEc9xYA8rXH64rcA4MZrewqT+8x7k+fPlUceWNTwV1NNKFSOVzYHUQX+UgKWsLHe4Y8sX7dpwJnm3z+XHI6kR7S5+tTRS1udUfDDvLSwUyrfQoVxIAW0hmOkjyk32Ubk4lVx96A9oC7a+JK/inOaHN6HJEq4zDVIQlXNTs0q6QRa/lV2JUdNiwBudzLKR0M5LKyfjXJ+eJv4ekpjlP4rW8R6uqZ9TvHduKpFxsdxqtbYXsb9sK3rWtJJ5Jmktupt1HlYwF7DpiFVcWnMfhErJKeOFeHJIU13ewLWXsG2788Au2sDPXEtSy65S6DjP1g8uYV9EksdMbzTIQkjWVXXuS3IfXBVsc5BhuxY7GXLDpj194syqSdIkp5n8rVRaulkYiR2ZQQNN90Wz777qCLXIwOuYfw5KRDSraNafNHxDP/E38URTz5aHh1mUSxnc2IbV07Wsu/8ATjL8NbbeM+8d11TXUGtOuRKRmcHw+YPGHLaFA1d7cz++NixsmUpUKmAHYAQWmgeeeQQi4UC9/wBPvjR0LAVnPrMrXKTdGKSNTpltaVZoKeRhMAPlYkbn9sdqgTzI0jhWwe8xVVUTZrJOagNHJujOb2v69MJseOJr0rsfmNsskUpU6YxLqh0grY6Lm1+3p9cL2cAxl+dpB7/WKair4s8ji5BbY4GpcIARDyp7zpsd0y/gKrfGU8heaQHdQNuftsMeW4Nm4n4T0jWc2bifhPSEyzKG40IaOjaMJEL2ErAjc/c4mtezcsD9ICocbTy3f2gEGds9XmdLGsApjUid2cb3C77/AEGPWaIbdMqzC1LbdcoJwB1+QE1yStiqs/p3rEV4Vp5YwshsBsDcn2Bxfn1iA8SfVa1v4bsOPc+s3yjLzVQ1pmkZoKeQU0a82kBJZQB08rc/TFAr3HfnibWv8UXw+jawyxPT5yPK2n/B6qkiL/EUNX8Ok6b6BcmMsf5RdG7HTbAa1CqizH3SDDpwwCHjggg/p74gXjSoWl8PzfAAJBmWgTwar8OYMGZ17q4Bv6g3sb4YFgKhh0MzynxbW+8p+o7TmsrurM1tcV9RQ3tytfBEAiSzlHJEny6fhLVQSKjtNGd3uNxvtbr/AGGBYcQ6nG7bnkGP4oqum+BSBQ89AGZIywUPG38asduvpb1xG/kc8iHsVVfglW9OoxLR4RpTQZcUggrokJdmWSoW4Po2kD7NtfluSWAT6RBq61ONx+mIsq4WGamuXJqaF43AFXXTM5iFzayKzBbG9rqbWttbFL2MvLYH9Y3Vp6X4rBdvoIZDXUEGRSI1foipdbXVhxaqYm6kLc2jFwee59cKMy2jHYfWaa0WUP5j8s3U9lHp85HkudmOlhFXBJBTz1BlhqJIy4e45W39Tbmdj1viq/Ss53Z5xjEXS+sM5HQnj99pFPXVNdmVGpl1U6BoIDIpUWXe9untzta+GDkqEPUS3T7Rd5wHDZ4/WR0ASrz+eocqEjiWlDIhUi6tI4t33Ue5wpr7CKgo+ctNedSz/wDiMfjDc5k10ZeZrkm7NyHIMfoCT97YU0SfbYlmQuTOfvI80zyODxCxOk7735f+9sardYgCW+L1g0LyQ1j8FmF12Pcb40NI6hDu7TO1lbPcoHeMYtMcLAnY/Nc7G3fviuy5rOZoafS1U8d5LlpggphURSEVkyyLKOGDwxfygfy9MLXuVxtldCLZncOhhFLTtT1skESGFHp+IV13Vwhufvty7HFSZsq6y4MquR2/oZBUVFDTaIZDChVeTA35k3sO/PfvhukhqwZlalXruYe86fIhSsqYJalvh2jD1Lgblv5R73G2PEqdyKwXkHj5es9OpyisBz2/vFOeVb0uUwNWOROg/Lh5FFGwv/UdsPaWoPadnQ9TLPNSnfb/ACjqfeV3LSyx66k/mysXYX5Xx6ZfhAA7T5h4jrjqLmYd4fTrFLmlBHK8iRySMv5a6mJ0kiw68gPriCu4YjHgOtOj1D2hc4WGQSV2W+MpKCnaIz1lNwjqIIhNgb36FRf9cWFSFwJ6PSHzVF+vGOrfTpCcqqYsu8VNRxkGhzKm4eh3sC6q2m5PUhr/AFGLLEDVY/CRp9U+qH8RYMFuR9f7CVTxvWaM/XKuKJRTowkKE6TIT2PIkAE2/mwhTpmprOTmM36kW2AAY/f6Sul1Q6gutlBXSwvf6fr9MNg5EVdQTmatCoYQK4bWwEcp2Dd9/S+Ox3gb+ML6w6nqpKVYkqqVqxVW4HGZbRttpt0N97j7YpIU9ZpVW2K5rU5Pt1/5jpM5yyIwcWWsgpZWkMkXBV5UBsLk6NJF0Pry54HyRxg8exhG88l1+LjscflGMPiChiqdWXUzZq1tKzZmrRhFHI3Js25PJNXriCK6zkmTm/UJtVCPlwPz5grZdW5mtW9bVRy/BrJU/CaeGgBfU9hzFtX8W/IYFHNhwowJRqrDVUbVIdwQMdh8/UxX+JLU1k2YFjHSRHVAhjOh5tNhdQbDURb2v2wxj+TvE6/Lpc3FT9pnHz78+03hqeAMpo3qY9jPJKVkJMRbSvmHTZCQRzBxDAupI4jWjsqo1KIW3EBgfTPXj9ZY8hkmSgFRM2maqlaqluu41BnUAdwCm3e2MTXMLLT7cf3j+nG6sMR15+v/ABFvimqiSg4IkQuIlYq19wNIIHe+4Hob9MM+HplmYiBqnKJj1lWjBKiwO/W9gL7D9ScNMeYusGmBWrDbAFWFh0scOaQ5BHtFdVw6NCpWVYTr31uq6SehIv8Av+uBAMd1DgJyYLXzzLX1b0gMTOoc8MmwXqMTgFeRMzgMRS3HWGKTQzDMaRGnpdIVuIdRII5/S+9uWBx/L6Syixid79z09vWG1MVFPwpVUyI0YKto3I9fXmPphXFiHCHiaXlJb8TToaRVNQ8Eax0kcckjlUMjlQy8zbHmiyICSScfLvNEsignJOPlEPiakaCemq6mTixu7ASAnSTyB3+31xr+F2I2VAwZh/6hFtuk+y4Veo7waKmnnlK08bysFLWQXOkcztjZAnz0AtwBI3mlpsxytoJhFIKlQJb20Frre/YXxIBwcTZ/08yDVgvyuOZt4r4FLNSVVD+YKdmR5GU3luR5j6E3t1tghjGBN0al/EhZbYuK87R8u8a57LQVWQ/Ey+dAuuOSPYmdyDZfRQD7AjtivBJwp4Et3+X0XAI49lHA/E9T7TnLqxq3qGYszc9X98XGKZ5zNZXZSWW635Ed8AgxwZdYfhz6zZeFIixSMgSXZGY7Rebe+JIwZG/cu1O8MpZKijCNIyuJCCjzKWusb8rrcqPocVNhuJeua7MjkkQ+OQVFIsaxM8irKoeCaOUeZ9a9Q217Hbrio+Xnnj8CJFb2Jp2qB5PQiGVs6ARq1F8Oq1Jk1VM8cF0IGpLAk8wbEA2B5YrQVDOOc+mTLNRbZa1Tq2GSeqzLn09dVGSFIzBxZnIMUbKgA8urdmvbc2F7HTexxaHb+VYKU0pb9q23fz8/fEADoKakqK2jaPLKZuGCiaXl82q7E7a7HYYnqcL+MYQXU6c2WkNt6A+nr9O0WSy/iGYK1RI6ComjjJJuUiJCAXHULthphsrOO0xPONur39M56e86PJUwuusukYClgOqmzi30H0BOPKbWz+/aex2bFx26f0nOc8r/AI6qldGOksAP+0cv7/bHpdPSK69neYGqv8yzf2HSYp22UkKbdzzsMLOIypmlYeFLG6kEr5CQOakf5wxoz9p85TrB9lmakhhHz2eMm3P5hfDq14RjF9RfuKAczavZIcxhk3EUqlJCN7n369MKjkSXJQLY68jPAm1DJUUUzUjhnppAbJf13t33AuOtsCxGMyVQqd3Qkce2ZKaGCdi9NVLDHe3DaQLp+h++IzJeyyrCoCROw00aCbhxiWOcRFuG76w6E+bS3MG+POCnS6oYqyG7Z9RNZ3dV3HBXPUcc/KV//qAsMWSTqR8jIEbkEP8ACij23JxHhIf+IA+ef7wNSQdKxf8AyfeD5Hm9NR0arLSg1YIeOVWtrJtdJN90tfYd8eoVwM5nzyu1ayRt5zwf7+0R5rHLXrXVcaoGgtJEibKDq1ED2Aw3pqTZW7ek1PD28gBzxuP5R7nVJHmvh4zUJ4kk6JUtLIfma19Pa+5vbYbDnzUHwDiegGbGPmEKvQAdAPX5mUyrqRpEMZqRTISYo5CDouBflt/8xKrtiljs2M9B0gBkViQH++DlU8WBDcS3Dtub7j2wLLmGjYGDIzNJGRKkNzzI03DDfmPriSy45Mja6HIHBmVn4cIRXZQsJASS9tzvY9NunpiraGPEarbYFcjJENjnpzUJU12VmRJJ2dgtirqB5lH739cAQ3rLqVrUsvd5LQFqLXJSZeRwijcSZQAvmut7X2I2t1vgHIJy3IhVUu1QoVsMD16HHp6w3MKinE0tRmApzUCZyadVNoXsL2jvsGt81z9MQFc8AYE570ZGdW3WJwNw4i9JFzCpnWWokgoo24yUxf57He55awpY3seVgCTbDlaCtcTH1OoGosZwMZ6/3huUeHPxCqlmSfVRpMRTypdTNpY7rfcDbtf2wnqdXsPloMsY1otEp+1sPw9veF+J62GPRR8biyOLlVBGhSb2Pvc7euE9FWxJcjAE1NZqQylF7yrTx6ZAqDZiCMa9DZImVZjGJvSCQs6opIXv64p1IVGjOlcsvMkr4Z2VWdLIWuxA2HXA6RqzZgmHq93l4UQeQXUjuMbhAYbZjZwcwwxLmtMzOwj0j08pA3v2X98ZDg1tiPV7Dx1LflIqSrXQtBm6MqIdnC3ZeX7AWHviDzyIfIynfPWMIyHW4rqJgORqE1Nbtcc7cvphc0oT3ELe+SF5ltako6LTNMM3hcCyzQV7OAO25/4xjVam4t9mV/8AnE1hpUsG1X/rAKuLLsx4cMmaZ9UkN+XEzo9j6XGGarraiW2KPfmS/hjsm1n4jBfC1RwQ0dRU6rbJMIXP/iN/rig+L/FggfnM8eGaRPhGD+EQVc9ZQpKrTUjU8dwySJw/Qja/749DpfEm2hAvEHVeFKo35A9JXW8QVyU/wNNM6USuWWEkNbfva9vTFh5OYiW7Qj4qbT8ynvtjpGYO9QbnVGh+mOnZgFZWCZAiJoF98dIJzJstqJ451ghfVG29j09sC6BpYlpXpG8k7wyqsk2hSRqUm4I+uFX04PSOpqUIw0lc0ckzpHCEA2SRhp4htv8ALa18cUdcbSYarWcMcZkyU9KaOSWsqKiBTZBCk7txCvyjS1xYfbABre54+UP+Hq3/AAdfXMIq6SlqqCmamlmMTtbhwQxhg39QUC/LnfFYZ0csPzzOegOppLY/WAPk1KjaJMzKbXYFU/LA/mOqw9ufpi8X3N/LEj4fSoyWmZc7aGiSjoZJBEihVbZfrtvf69TgF0+5izdTLnuVV2oYmju9SrOSSTe5PPDJGBFveFVCakB6jcYGtyrZnEAjEihlZQdQbSxBJHM4m/a7ZEs0+U6w2KsVDvcoRupBthSysHpGRYO8CNQIJZERQ0eoaSQdx29sa2mt3VAOeZmXVkOcDiRQ1Jhl4sTKDcHSd1NuhGLblSxesGl3RofUVMMpHxSJexsVbUBfrfn1J+2MtfaO4UEL2H5yBzR3/KqtvXf/AIxOD3nJtxyZavxdeFKplhemlW6XYsqfVre+FX8OUuGXiPpqK8A5hOQOYYjNSS07ljvJpfzDsDtb6YJtALGG85HpCu19bjGYWJauYzq0qqsw84jL2UDoLk/XHf7fUWDekVbXYACDp6znXiGKSHMnSWRpOqk9BjQRQowJn2WPY2XOTAZ2RmXhKFAXf3wUrh+XKHgd313vbVjoWJBmJVCqR6tZ3+mOkGL7G+k98TIjSiy+SN0kZ9LndRiJIEKq4UGkzsRY3NziJMUVM3EqHdflB2OOkdJJAxaMlmbtzx0IEyGSRixVZHC23Go747EgkyeKk4kKNexJv7Y6d1k42A9MBLBMxn81ffEGSIVKfyWb0tgAOZxi6lnP+24DWO2DZAZC2EQ4SRosYkRbh9RIPTtgDWYytgMlNXFrkdYx5rALY7Yq8s9JbkSSM04kCsZGDD5gPlx3ltI3ieM8RjdVEmtTsRyb3HTEeUZO7vNDNT382sHsAMEK2lZsXMFhYvFEKiTTTg2sOdr74biE6BTwwGlV6OULHp8qgfrjoQh4VRRsbkX6nbHSZQvF1AOItVC11A0Sr1U47MEytMjadY3W9r4mDHmWppy5f6iTiIYi7OTapQrb5cTBMzlUGucyPYgC9/XHSRGsDI0yyykjSNr4idmL6+p+LExUWCmwxMjMUAk7DHSIfApSBehO+IhQFz5z74mDGdFMJIgtt12xEKZwEsEwR2NvXEGSIVptEQD0wAPMnEAyuIyTnlf1xcTKcR8Mmjqo7F+XXAbjCAzI5MjZUCRODbr3wJbMsG4dYvejqYQfymIB3YDbBgiGQxkMbsWsUNuuJlR394SsYty5Y7MiE5JBDUEz1bLw4B5V9u+CgCW7IcyXMEqJVULGraUB7Y6SOYRVEPTzIXP5e4BPI88RJlVraiOsoqyoJAd1037kYmRKlqJUJ0viYMtCR8KnVB/CmIhxDm5PxC/9uJEAzSCdw0Sx7WO+OnCOZZI0ZAxsGFt8RJius00s5MRurjliRBgB3tY7nHGdGDeWNR2GIhRaSLnEwYwy1r3UdBiDJEnAwBlonreYYEwhDGUlD7YAHmdAMq2qJFPPFx6SodYXW1MkRSNCbEXsMA3SXAekE+MqA/kZr+mB2jE7ccy001dryj4Zl4cxFgxF8EpkshPIiyriMUCgaTMw82nBTvi28z1MYuCt+fW4x0riaKZowygkI4swB54slUu/h2lSnymkcElqmQasRCEEr5WXMc1cs1o1Flv1tjp0TRuqZGGCAlufvjpHaJoIyayONrX1jcY6QOsskxskvptjoZiDM3K1Vv6cSJWZHl+7sx/gFxjpIk9Q3HqY1bkoviJ2YHUOZnZjtbYDEyJrEgLr744zowmj8uInRURY/XEzoZl1xI3YjEGSIX0vioy0T3VffEGTD1VQCd9xvisdYWIPT0hSYzArpccsX5lZHMcZWIFrNVRFrATYWxHeFk7eJHVV1PUQ1H+mVGR7RlR++IMhScwZqwtHcDp1xyiETiLHrJFlY33viCJO44xJlYlQ3cXwUCf/2Q==" },
            { name: "Pure Natural", location: "Cuttack, Odisha", rating: 4.9, reviews: 120, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
            { name: "Earthy Hands Pottery", location: "Puri, Odisha", rating: 4.7, reviews: 98, img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80" },
            { name: "Weave Magic", location: "Berhampur, Odisha", rating: 4.6, reviews: 85, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80" },
            { name: "Hills Organic", location: "Koraput, Odisha", rating: 4.8, reviews: 130, img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80" },
            { name: "Tribal Art Studio", location: "Baripada, Odisha", rating: 4.7, reviews: 74, img: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=300&q=80" },
            { name: "Green Roots Farm", location: "Sambalpur, Odisha", rating: 4.6, reviews: 91, img: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=300&q=80" },
            { name: "Spice Garden", location: "Rayagada, Odisha", rating: 4.9, reviews: 108, img: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=300&q=80" },
          ].map((biz) => (
            <div key={biz.name} className="business-card">
              <img src={biz.img} alt={biz.name} className="business-img" />
              <div className="business-info">
                <p className="business-name">{biz.name}</p>
                <p className="business-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {biz.location}
                </p>
                <p className="business-rating">⭐ {biz.rating} ({biz.reviews})</p>
                <button className="view-store-btn">View Store</button>
              </div>
            </div>
          ))}
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