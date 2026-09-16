"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import "./wishlist.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Recently Added");
  const [selected, setSelected] = useState({});
  const [selectAll, setSelectAll] = useState(false);
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

  const toggleSelect = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    const map = {};
    items.forEach((i) => (map[i.wishlistItemId] = next));
    setSelected(map);
  };

  const handleRemove = async (wishlistItemId) => {
    await removeFromWishlist(wishlistItemId);
    syncWishlist();
  };

  const handleAddToCart = async (item) => {
    await addToCart({ productId: item.id, type: item.type || "product" });
  };

  const handleMoveAllToCart = async () => {
    for (const item of items) {
      await addToCart({ productId: item.id, type: item.type || "product" });
    }
  };

  if (loading) {
    return <main className="wl-page"><p className="wl-loading">Loading…</p></main>;
  }

  return (
    <main className="wl-page">
      <div className="wl-header">
        <div>
          <h1 className="wl-title">My Wishlist ({items.length})</h1>
          <p className="wl-subtitle">Save your favorite products from local businesses.</p>
        </div>
        <div className="wl-header-actions">
          <button className="wl-share-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
            </svg>
            Share Wishlist
          </button>
          <button className="wl-move-all-btn" onClick={handleMoveAllToCart} disabled={items.length === 0}>
            🛒 Move All To Cart
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="wl-empty">
          <p className="wl-empty-icon">🤍</p>
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="wl-continue-btn">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="wl-controls-row">
            <label className="wl-select-all">
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              Select All
            </label>
            <div className="wl-sort-row">
              <span>Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option>Recently Added</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
              </select>
            </div>
          </div>

          <div className="wl-grid">
            {sortedItems.map((item) => (
              <div key={item.wishlistItemId} className="wl-card">
                <input
                  type="checkbox"
                  className="wl-card-checkbox"
                  checked={!!selected[item.wishlistItemId]}
                  onChange={() => toggleSelect(item.wishlistItemId)}
                />
                <button
                  className="wl-heart-btn"
                  aria-label="Remove from wishlist"
                  onClick={() => handleRemove(item.wishlistItemId)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#e63946" stroke="#e63946" strokeWidth="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <Link href={`/shop/${item.slug}`}>
                  <img src={item.img} alt={item.name} className="wl-card-img" />
                </Link>

                <div className="wl-card-body">
                  <p className="wl-card-name">{item.name}</p>
                  <p className="wl-card-seller">
                    {item.seller}
                    {item.verified && <span className="wl-verified">✓</span>}
                  </p>
                  <p className="wl-card-price">₹{item.price.toLocaleString("en-IN")}</p>
                  <p className={`wl-card-stock ${item.stock > 0 ? "in-stock" : "out-stock"}`}>
                    {item.stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>

                  <button
                    className="wl-add-to-cart-btn"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock === 0}
                  >
                    🛒 Add to Cart
                  </button>
                  <button className="wl-remove-btn" onClick={() => handleRemove(item.wishlistItemId)}>
                    🗑 Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {suggestions.length > 0 && (
        <div className="wl-suggestions-section">
          <h3>You may also like</h3>
          <div className="wl-suggestions-grid">
            {suggestions.map((p) => (
              <Link key={p.sku} href={`/shop/${p.sku}`} className="wl-suggestion-card">
                <img src={p.image_url || "https://placehold.co/300x300?text=No+Image"} alt={p.name} />
                <p className="wl-suggestion-name">{p.name}</p>
                <p className="wl-suggestion-price">₹{Number(p.price).toLocaleString("en-IN")}</p>
                <button
                  className="wl-suggestion-add-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart({ productId: p.id, type: "product" });
                  }}
                >
                  🛒 Add to Cart
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="wl-perks-strip">
        <div className="wl-perk">🎧 Local Support<span>We're here to help you</span></div>
        <div className="wl-perk">↺ Easy Returns<span>Hassle-free return policy</span></div>
        <div className="wl-perk">🚚 Fast Delivery<span>Quick delivery to your doorstep</span></div>
      </div>
    </main>
  );
}