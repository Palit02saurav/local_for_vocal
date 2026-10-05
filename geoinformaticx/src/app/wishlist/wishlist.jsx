"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { getWishlist, removeFromWishlist, addToWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import "./wishlist.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ---------- SVG ICONS (Lucide-style, 24x24) ---------- */
const ICONS = {
  cart: (<><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></>),
  trash: (<><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>),
  heart: (<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />),
  star: (<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />),
  arrowRight: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  store: (<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>),
  shield: (<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>),
  refresh: (<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>),
  truck: (<><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></>),
};

function Icon({ name, size = 18, stroke = 1.8, fill = "none" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* Banner illustration: heart card, plants, cart, bag */
function WishlistArt() {
  return (
    <svg className="wl-hero-art" viewBox="0 0 340 150" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wlHeart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3aa66a" />
          <stop offset="1" stopColor="#1b6b45" />
        </linearGradient>
      </defs>
      {/* plants */}
      <path d="M28 150C16 108 40 70 84 56C98 98 76 134 28 150Z" fill="#2f8f5b" />
      <path d="M66 150C60 112 86 86 128 78C132 114 108 142 66 150Z" fill="#1b6b45" />
      <path d="M300 150C316 112 306 70 278 40C256 80 262 122 300 150Z" fill="#3a9d68" />
      <path d="M270 150C272 108 296 82 332 74C334 112 306 142 270 150Z" fill="#2f8f5b" />
      {/* heart card */}
      <rect x="108" y="14" width="100" height="100" rx="22" fill="#eaf6ee" stroke="#cfe6d7" strokeWidth="2" />
      <path d="M158 92C128 72 126 50 140 42c9-5 18-1 18 8 0-9 9-13 18-8 14 8 12 30-18 50Z" fill="url(#wlHeart)" />
      <circle cx="196" cy="98" r="4" fill="#58b583" />
      {/* small heart badge */}
      <rect x="224" y="8" width="34" height="30" rx="8" fill="#fff" />
      <path d="M241 30c-8-5-9-11-5-13 3-1.5 5 .5 5 2.5 0-2 2-4 5-2.5 4 2 3 8-5 13Z" fill="#e5483b" />
      {/* cart */}
      <path d="M214 62H284L272 98H224Z" fill="#fff" fillOpacity=".6" stroke="#9aa5a0" strokeWidth="3" strokeLinejoin="round" />
      <path d="M226 62l5 36M242 62l2 36M258 62v36M274 62l-4 36M220 80H280" stroke="#b6bfba" strokeWidth="2" />
      <path d="M214 62L206 40H192" stroke="#8f9a95" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="232" cy="110" r="6" fill="#37413c" />
      <circle cx="268" cy="110" r="6" fill="#37413c" />
      {/* bag */}
      <rect x="290" y="78" width="38" height="68" rx="4" fill="#e3b97d" />
      <path d="M299 78c0-16 20-16 20 0" stroke="#b98a4c" strokeWidth="3" fill="none" />
    </svg>
  );
}

const FALLBACK_IMG = "https://placehold.co/400x300?text=No+Image";
const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function StockPill({ inStock }) {
  return (
    <span className={`wl-stock ${inStock ? "in" : "out"}`}>
      <i />
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}

function Rating({ value, count }) {
  if (!count) return <span />;
  return (
    <span className="wl-rating">
      <Icon name="star" size={15} fill="#f5a623" stroke={0} />
      <b>{Number(value).toFixed(1)}</b>
      <em>({count})</em>
    </span>
  );
}

const isService = (item) => item.type === "service";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Recently Added");
  const [selected, setSelected] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  const syncWishlist = async () => {
    const list = await getWishlist();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    syncWishlist();
    window.addEventListener("storage", syncWishlist);
    return () => window.removeEventListener("storage", syncWishlist);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/products/public`)
      .then((res) => {
        const products = res.data.data?.products || [];
        setSuggestions(products.slice(0, 6));
      })
      .catch((err) => console.error("Failed to load suggestions:", err));
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "Price Low to High") return a.price - b.price;
    if (sortBy === "Price High to Low") return b.price - a.price;
    return 0; // Recently Added = backend order (newest first)
  });

  const selectedItems = items.filter((i) => selected[i.wishlistItemId]);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleSelect = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSelectAll = () => {
    const map = {};
    items.forEach((i) => (map[i.wishlistItemId] = !allSelected));
    setSelected(map);
  };

  const handleRemove = async (wishlistItemId) => {
    await removeFromWishlist(wishlistItemId);
    syncWishlist();
  };

  const handleAddToCart = async (item) => {
    await addToCart({ productId: item.id, type: item.type || "product" });
  };

  const handleAddSelectedToCart = async () => {
    for (const item of selectedItems) {
      await addToCart({ productId: item.id, type: item.type || "product" });
    }
    setSelected({});
  };

  if (loading) {
    return <main className="wl-page"><p className="wl-loading">Loading…</p></main>;
  }

  return (
    <main className="wl-page">
      {/* ---------- Banner ---------- */}
      <section className="wl-hero">
        <div className="wl-hero-text">
          <div className="wl-breadcrumb">
            <Link href="/">Home</Link> <span>›</span> <span>My Wishlist</span>
          </div>
          <h1 className="wl-title">My <span>Wishlist</span></h1>
          <p className="wl-subtitle">Your favorite products and services, all in one place.</p>
        </div>
        <WishlistArt />
      </section>

      {items.length === 0 ? (
        <div className="wl-empty">
          <p className="wl-empty-icon">🤍</p>
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="wl-continue-btn">Start Shopping</Link>
        </div>
      ) : (
        <>
          {/* ---------- Controls ---------- */}
          <div className="wl-controls-row">
            <label className="wl-select-all">
              <input type="checkbox" className="wl-check" checked={allSelected} onChange={toggleSelectAll} />
              Select All ({items.length})
            </label>

            {selectedItems.length > 0 && (
              <button className="wl-selected-btn" onClick={handleAddSelectedToCart}>
                <Icon name="cart" size={16} />
                Add Selected to Cart ({selectedItems.length})
              </button>
            )}

            <div className="wl-sort-row">
              <span>Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option>Recently Added</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
              </select>
            </div>
          </div>

          {/* ---------- Wishlist cards ---------- */}
          <div className="wl-grid">
            {sortedItems.map((item) => (
              <div key={item.wishlistItemId} className="wl-card">
                <div className="wl-card-media">
                  <input
                    type="checkbox"
                    className="wl-check wl-card-checkbox"
                    checked={!!selected[item.wishlistItemId]}
                    onChange={() => toggleSelect(item.wishlistItemId)}
                  />
                  <button
                    className="wl-heart-btn"
                    aria-label="Remove from wishlist"
                    onClick={() => handleRemove(item.wishlistItemId)}
                  >
                    <Icon name="heart" size={18} fill="#e5483b" stroke={1.5} />
                  </button>
                  <Link href={isService(item) ? `/services/${item.slug}` : `/shop/${item.slug}`}>
                    <img
                      src={item.img}
                      alt={item.name}
                      className="wl-card-img"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
                    />
                  </Link>
                </div>

                <div className="wl-card-body">
                  <p className="wl-card-name">{item.name}</p>
                  <p className="wl-card-price">{inr(item.price)}</p>
                  <div className="wl-card-meta">
                    {isService(item) ? <span /> : <StockPill inStock={item.stock > 0} />}
                    <Rating value={item.rating} count={item.reviewCount} />
                  </div>
                  <div className="wl-card-actions">
                    <button
                      className="wl-add-btn"
                      onClick={() => handleAddToCart(item)}
                      disabled={!isService(item) && item.stock === 0}
                    >
                      <Icon name="cart" size={17} />
                      Add to Cart
                    </button>
                    <button
                      className="wl-del-btn"
                      aria-label="Remove from wishlist"
                      onClick={() => handleRemove(item.wishlistItemId)}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------- You may also like ---------- */}
      {suggestions.length > 0 && (
        <section className="wl-suggestions">
          <div className="wl-sug-head">
            <h3>You may <span>also like</span></h3>
            <Link href="/shop" className="wl-view-all">
              View All <Icon name="arrowRight" size={16} stroke={2} />
            </Link>
          </div>

          <div className="wl-sug-grid">
            {suggestions.map((p) => (
              <Link key={p.sku} href={`/shop/${p.sku}`} className="wl-sug-card">
                <div className="wl-sug-media">
                  <button
                    className="wl-sug-heart"
                    aria-label="Add to wishlist"
                    onClick={(e) => {
                      e.preventDefault();
                      addToWishlist({ productId: p.id, type: "product" });
                    }}
                  >
                    <Icon name="heart" size={15} stroke={1.8} />
                  </button>
                  <img
                    src={p.image_url || FALLBACK_IMG}
                    alt={p.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
                  />
                </div>
                <p className="wl-sug-name">{p.name}</p>
                <p className="wl-sug-price">{inr(p.price)}</p>
                <div className="wl-card-meta">
                  <StockPill inStock={Number(p.stock) > 0} />
                  <Rating value={p.avg_rating} count={p.review_count} />
                </div>
                <button
                  className="wl-add-btn wl-sug-add"
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart({ productId: p.id, type: "product" });
                  }}
                >
                  <Icon name="cart" size={16} />
                  Add to Cart
                </button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Perks ---------- */}
      <div className="wl-perks">
        <div className="wl-perk">
          <Icon name="store" size={30} stroke={1.6} />
          <div><strong>Local Support</strong><span>We're here to help you</span></div>
        </div>
        <div className="wl-perk">
          <Icon name="shield" size={30} stroke={1.6} />
          <div><strong>Secure Payments</strong><span>100% safe and encrypted</span></div>
        </div>
        <div className="wl-perk">
          <Icon name="refresh" size={30} stroke={1.6} />
          <div><strong>Easy Returns</strong><span>Hassle-free return policy</span></div>
        </div>
        <div className="wl-perk">
          <Icon name="truck" size={30} stroke={1.6} />
          <div><strong>Fast Delivery</strong><span>Quick delivery to your doorstep</span></div>
        </div>
      </div>
    </main>
  );
}