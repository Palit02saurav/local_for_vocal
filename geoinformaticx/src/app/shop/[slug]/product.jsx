"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { addToCart } from "@/lib/cart";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";
import "./product.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const NO_IMAGE = "https://placehold.co/600x600?text=No+Image";
const ZOOM = 2.5; 

const Stars = ({ value = 0 }) => (
  <span className="pd-stars" style={{ "--pct": `${(Math.min(5, Number(value) || 0) / 5) * 100}%` }}>
    ★★★★★
  </span>
);

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ProductDetail({ slug }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [zoom, setZoom] = useState(null); 

  const syncWishlist = async (productId) => {
    const list = await getWishlist();
    const match = list.find((w) => w.type === "product" && String(w.id) === String(productId));
    setWishlistItemId(match ? match.wishlistItemId : null);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/products/public`);
        const products = res.data.data?.products || [];
        const found = products.find((p) => p.sku === slug) || null;
        if (!alive) return;
        setProduct(found);
        setRelated(products.filter((p) => p.sku !== slug).slice(0, 4));
        if (found) {
          axios
            .get(`${API_BASE}/reviews/product/${found.id}`)
            .then((r) => alive && setReviewData(r.data.data))
            .catch(() => {});
          syncWishlist(found.id);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return <main className="pd-page"><p className="pd-muted" style={{ padding: 40 }}>Loading…</p></main>;
  }

  if (!product) {
    return (
      <main className="pd-page">
        <p className="pd-muted" style={{ padding: 40 }}>Product not found.</p>
        <Link href="/shop" className="pd-store-btn">Back to Shop</Link>
      </main>
    );
  }

  const sellerName =
    product.seller?.store_name || product.seller?.full_name || product.vendor?.full_name || "Geoinformaticx";
  const sellerLocation = product.seller?.location || product.vendor?.address || "";

  const galleryImages = [
    product.image_url,
    ...(product.gallery_urls ? product.gallery_urls.split(",") : []),
  ]
    .map((url) => (url || "").trim())
    .filter((url, idx, arr) => url && arr.indexOf(url) === idx);
  if (galleryImages.length === 0) galleryImages.push(NO_IMAGE);
  const total = galleryImages.length;
  const image = galleryImages[imgIndex] || galleryImages[0];

  const price = Number(product.price);
  const stock = Number(product.stock);
  const summary = reviewData?.summary;
  const avg = summary?.average ?? product.avg_rating ?? 0;
  const count = summary?.count ?? product.review_count ?? 0;
  const reviewList = reviewData?.reviews || [];

  const isNew = product.created_at && Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 3600 * 1000;
  const typeLabel =
    product.delivery_type === "Fresh"
      ? "Fresh Delivery"
      : product.product_type === "Regional Famous"
      ? "Regional Specialty"
      : "Regular Product";

  const tagList = (product.tags || "")
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  const specs = [
    { label: "Category", value: product.category },
    { label: "Brand", value: product.brand },
    { label: "Weight", value: product.weight ? `${Number(product.weight)} kg` : "" },
    { label: "Dimensions (L x W x H)", value: product.dimensions ? `${product.dimensions} cm` : "" },
    {
      label: "Tags",
      value: tagList.length ? tagList.map((t) => <span className="pd-tag" key={t}>{t}</span>) : "",
    },
    { label: "SKU", value: product.sku },
  ].filter((r) => r.value);

  const returnSub = product.return_replace_accepted ? `${product.return_replace_days}-day return` : "Hassle Free";

  const TABS = [
    { key: "description", label: "Description", target: "pd-details" },
    { key: "reviews", label: `Reviews (${count})`, target: "pd-reviews" },
  ];
  const goTo = (t) => setActiveTab(t.key);

  const toggleWishlist = async () => {
    if (wishlistItemId) {
      await removeFromWishlist(wishlistItemId);
    } else {
      const result = await addToWishlist({ productId: product.id, type: "product" });
      if (result.requiresLogin) {
        router.push(`/login?redirect=/shop/${slug}`);
        return;
      }
    }
    syncWishlist(product.id);
  };

  const handleAddToCart = async () => {
    const result = await addToCart({ productId: product.id, type: "product" }, quantity);
    if (result.requiresLogin) router.push(`/login?redirect=/shop/${slug}`);
  };

  const handleBuyNow = async () => {
    const result = await addToCart({ productId: product.id, type: "product" }, quantity);
    if (result.requiresLogin) {
      router.push(`/login?redirect=/shop/${slug}`);
      return;
    }
    if (!result.success) {
      alert(result.message || "Could not continue to checkout. Please try again.");
      return;
    }
    router.push("/checkout");
  };

  const handleRelatedCart = async (p) => {
    const result = await addToCart({ productId: p.id, type: "product" }, 1);
    if (result.requiresLogin) router.push(`/login?redirect=/shop/${slug}`);
  };

  const handleZoomMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const lw = rect.width / ZOOM;
    const lh = rect.height / ZOOM;
    const cx = Math.min(Math.max(e.clientX - rect.left, lw / 2), rect.width - lw / 2);
    const cy = Math.min(Math.max(e.clientY - rect.top, lh / 2), rect.height - lh / 2);
    setZoom({ cx, cy, w: rect.width, h: rect.height });
  };

  return (
    <main className="pd-page">
      <div className="pd-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>{" "}
        <span>›</span>
        <span>{product.name}</span>
      </div>

      {/* ===== Top: gallery + info ===== */}
      <div className="pd-top">
        <div className="pd-card pd-gallery">
          {total > 1 && (
            <div className="pd-thumbs">
              {galleryImages.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className={`pd-thumb ${i === imgIndex ? "active" : ""}`}
                  onMouseEnter={() => setImgIndex(i)}
                  onClick={() => setImgIndex(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={url} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          <div className="pd-main" onMouseMove={handleZoomMove} onMouseLeave={() => setZoom(null)}>
            {isNew && <span className="pd-new">New</span>}
            <button className="pd-heart" onClick={toggleWishlist} aria-label="Toggle wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlistItemId ? "#e74c3c" : "none"} stroke={wishlistItemId ? "#e74c3c" : "#444"} strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <img src={image} alt={product.name} />
            {zoom && (
              <div
                className="pd-lens"
                style={{
                  width: zoom.w / ZOOM,
                  height: zoom.h / ZOOM,
                  left: zoom.cx - zoom.w / ZOOM / 2,
                  top: zoom.cy - zoom.h / ZOOM / 2,
                }}
              />
            )}
          </div>

          {zoom && (
            <div className="pd-zoom-pane" style={{ width: zoom.w, height: zoom.h }}>
              <img
                src={image}
                alt=""
                style={{
                  width: zoom.w * ZOOM,
                  height: zoom.h * ZOOM,
                  left: zoom.w / 2 - zoom.cx * ZOOM,
                  top: zoom.h / 2 - zoom.cy * ZOOM,
                }}
              />
            </div>
          )}
        </div>

        <div className="pd-card pd-info">
          <div className="pd-title-row">
            <h1 className="pd-name">{product.name}</h1>
            <span className="pd-type">
              <Icon size={16}><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></Icon>
              {typeLabel}
            </span>
          </div>

          <div className="pd-rating-row">
            <Stars value={avg} />
            <span className="pd-muted">{count > 0 ? `${avg} (${count} review${count > 1 ? "s" : ""})` : "No reviews yet"}</span>
          </div>

          <p className="pd-price">₹{price.toLocaleString("en-IN")}</p>
          <p className={`pd-stock ${stock > 0 ? "in" : "out"}`}>
            <span className="pd-dot" />
            {stock > 0 ? `In Stock (${stock} available)` : "Out of Stock"}
          </p>

          <div className="pd-seller-row" id="pd-seller">
            <img src={image} alt={sellerName} className="pd-seller-avatar" />
            <div>
              <p className="pd-seller-name">Sold by <strong>{sellerName}</strong></p>
              {sellerLocation && <p className="pd-seller-loc">📍 {sellerLocation}</p>}
            </div>
            {product.seller?.id && (
              <Link href={`/store/${product.seller.id}`} className="pd-store-btn">View Store ›</Link>
            )}
          </div>

          <div className="pd-qty-row">
            <span className="pd-qty-label">Quantity</span>
            <div className="pd-qty">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1))} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button className="pd-btn pd-add" onClick={handleAddToCart} disabled={stock === 0}>
            <Icon size={20}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6" /></Icon>
            Add to Cart
          </button>
          <button className="pd-btn pd-buy" onClick={handleBuyNow} disabled={stock === 0}>
            <Icon size={20}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></Icon>
            Buy Now
          </button>

          <div className="pd-trust">
            <div className="pd-trust-item">
              <Icon size={26}><path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M9 20v-6h6v6" /></Icon>
              <strong>Local Seller</strong><small>Support Local</small>
            </div>
            <div className="pd-trust-item">
              <Icon size={26}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></Icon>
              <strong>Secure Payments</strong><small>100% Safe</small>
            </div>
            <div className="pd-trust-item">
              <Icon size={26}><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></Icon>
              <strong>Easy Returns</strong><small>{returnSub}</small>
            </div>
            <div className="pd-trust-item">
              <Icon size={26}><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Icon>
              <strong>Fast Delivery</strong><small>On Time</small>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="pd-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={activeTab === t.key ? "active" : ""} onClick={() => goTo(t)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== Description + Specifications ===== */}
      {activeTab === "description" && (
      <div className="pd-detail-row" id="pd-details">
        <section className="pd-card">
          <div className="pd-card-head">
            <div className="pd-card-title">
              <span className="pd-badge-icon">
                <Icon size={20}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h8" /></Icon>
              </span>
              <h3>Product Description</h3>
            </div>
          </div>
          <p className="pd-description">{product.description || "No description provided."}</p>
        </section>

        <section className="pd-card" id="pd-specs">
          <div className="pd-card-head">
            <div className="pd-card-title">
              <span className="pd-badge-icon">
                <Icon size={20}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></Icon>
              </span>
              <h3>Specifications</h3>
            </div>
          </div>
          <table className="pd-spec">
            <tbody>
              {specs.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      )}

      {/* ===== Reviews ===== */}
      {activeTab === "reviews" && (
      <section className="pd-card pd-reviews" id="pd-reviews">
        <div className="pd-card-head">
          <div className="pd-card-title">
            <span className="pd-badge-icon pd-badge-star">★</span>
            <h3>Customer Reviews ({count})</h3>
          </div>
        </div>

        {count === 0 ? (
          <p className="pd-muted">No reviews yet. Buy this product and be the first to review it.</p>
        ) : (
          <div className="pd-reviews-grid">
            {reviewList.slice(0, 3).map((r) => (
              <div className="pd-review" key={r.id}>
                <div className="pd-review-top">
                  <span className="pd-avatar">{(r.customer_name || "?").charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="pd-review-name">{r.customer_name}</p>
                    <Stars value={r.rating} />
                  </div>
                  <span className="pd-review-date">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="pd-review-text">{r.comment}</p>}
              </div>
            ))}

            <div className="pd-summary">
              <p className="pd-avg">{avg}</p>
              <Stars value={avg} />
              <p className="pd-muted pd-based">Based on {count} review{count > 1 ? "s" : ""}</p>
              <div className="pd-bars">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = summary?.breakdown?.[n] || 0;
                  return (
                    <div className="pd-bar-row" key={n}>
                      <span>{n} <i>★</i></span>
                      <div className="pd-bar"><div style={{ width: `${count ? (c / count) * 100 : 0}%` }} /></div>
                      <span>{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ===== Related ===== */}
      {related.length > 0 && (
        <section className="pd-related">
          <div className="pd-rel-head">
            <h3 className="pd-rel-title">You May Also Like</h3>
            <Link href="/shop" className="pd-view-all">View All Products →</Link>
          </div>
          <div className="pd-rel-grid">
            {related.map((p) => (
              <div className="pd-rel-card" key={p.sku}>
                <Link href={`/shop/${p.sku}`} className="pd-rel-link">
                  <img src={p.image_url || "https://placehold.co/300x300?text=No+Image"} alt={p.name} />
                  <div className="pd-rel-body">
                    <p className="pd-rel-name">{p.name}</p>
                    <p className="pd-rel-cat">{p.category}</p>
                    <p className="pd-rel-price">₹{Number(p.price).toLocaleString("en-IN")}</p>
                    {p.review_count > 0 && (
                      <p className="pd-rel-rating"><i>★</i> {p.avg_rating} ({p.review_count})</p>
                    )}
                  </div>
                </Link>
                <button className="pd-rel-cart" onClick={() => handleRelatedCart(p)} aria-label={`Add ${p.name} to cart`}>
                  <Icon size={18}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6" /></Icon>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}