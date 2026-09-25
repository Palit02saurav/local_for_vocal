"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { addToCart } from "@/lib/cart";
import { addToWishlist, removeFromWishlist, isWishlisted } from "@/lib/wishlist";
import "./product.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ProductDetail({ slug }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });

  useEffect(() => {
    axios
      .get(`${API_BASE}/products/public`)
      .then((res) => {
        const products = res.data.data?.products || [];
        const found = products.find((p) => p.sku === slug);
        setProduct(found || null);
        setRelatedProducts(products.filter((p) => p.sku !== slug).slice(0, 4));
        if (found) {
          setWishlisted(isWishlisted(found.name));
          setSelectedImage(found.image_url || null);
        }
      })
      .catch((err) => console.error("Failed to load product:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <main className="pd-page"><p style={{ padding: 40, color: "#888" }}>Loading…</p></main>;
  }

  if (!product) {
    return (
      <main className="pd-page">
        <p style={{ padding: 40, color: "#888" }}>Product not found.</p>
        <Link href="/shop" className="pd-visit-store-btn" style={{ maxWidth: 200 }}>Back to Shop</Link>
      </main>
    );
  }

  const sellerName = product.seller?.store_name || product.seller?.full_name || product.vendor?.full_name || "Geoinformaticx";
  const fallbackImage = "https://placehold.co/600x600?text=No+Image";
  const galleryImages = [
    product.image_url,
    ...(product.gallery_urls ? product.gallery_urls.split(",") : []),
  ]
    .map((url) => (url || "").trim())
    .filter((url, idx, arr) => url && arr.indexOf(url) === idx);
  if (galleryImages.length === 0) galleryImages.push(fallbackImage);

  const image = selectedImage || galleryImages[0];
  const price = Number(product.price);
  const stock = Number(product.stock);

  const handleImageMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${image})`,
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleImageMouseLeave = () => setZoomStyle({ display: "none" });

  const toggleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(product.name);
      setWishlisted(false);
    } else {
      addToWishlist({
        name: product.name,
        seller: sellerName,
        price,
        img: image,
      });
      setWishlisted(true);
    }
  };
  
  const handleAddToCart = async () => {
    const result = await addToCart({ productId: product.id, type: "product" }, quantity);
    if (result.requiresLogin) {
      router.push(`/login?redirect=/shop/${slug}`);
    }
  };

  return (
    <main className="pd-page">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link> <span>›</span>
        <span>{product.name}</span>
      </div>

      {/* Top section: image + info */}
      <div className="pd-top">
        <div className="pd-gallery">
          <div className="pd-image-zoom-container">
            <div
              className="pd-main-img-wrapper"
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
            >
              <button className="pd-wishlist-btn" onClick={toggleWishlist} aria-label="Toggle wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? "#e74c3c" : "none"} stroke={wishlisted ? "#e74c3c" : "#666"} strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <img src={image} alt={product.name} className="pd-main-img" />
            </div>
            <div className="pd-zoom-pane" style={zoomStyle} />
          </div>

          {galleryImages.length > 1 && (
            <div className="pd-thumbnails">
              {galleryImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb ${image === url ? "active" : ""}`}
                  onClick={() => setSelectedImage(url)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={url} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <h1 className="pd-name">{product.name}</h1>

          <p className="pd-price">₹{price.toLocaleString("en-IN")}</p>

          <p className={`pd-stock ${stock > 0 ? "in-stock" : "out-stock"}`}>
            <span className="pd-stock-dot" />
            {stock > 0 ? `In Stock (${stock} available)` : "Out of Stock"}
          </p>

          <div className="pd-seller-row">
            <img src={image} alt={sellerName} className="pd-seller-avatar" />
            <div>
              <p className="pd-seller-label">Sold by <strong>{sellerName}</strong></p>
            </div>
          </div>

          <div className="pd-qty-row">
            <span className="pd-qty-label">Quantity</span>
            <div className="pd-qty-stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button className="pd-add-to-cart-btn" onClick={handleAddToCart} disabled={stock === 0}>
            🛒 Add to Cart
          </button>
          <button className="pd-buy-now-btn" onClick={handleAddToCart} disabled={stock === 0}>
            Buy Now
          </button>
        </div>
      </div>

      {/* Trust strip */}
      <div className="pd-trust-strip">
        <div className="pd-trust-item"><span>👤</span> Local Seller</div>
        <div className="pd-trust-item"><span>🔒</span> Secure Payments</div>
        <div className="pd-trust-item"><span>↺</span> Easy Returns</div>
        <div className="pd-trust-item"><span>🚚</span> Fast Delivery</div>
      </div>

      {/* Description + Seller info */}
      <div className="pd-columns">
        <div className="pd-column pd-description-col">
          <h3>Product Description</h3>
          <p className="pd-description">{product.description || "No description provided."}</p>
        </div>

        <div className="pd-column pd-seller-col">
          <h3>Seller Information</h3>
          <div className="pd-seller-card">
            <img src={image} alt={sellerName} className="pd-seller-card-avatar" />
            <div>
              <p className="pd-seller-card-name">{sellerName}</p>
              {product.seller?.location && (
                <p className="pd-seller-card-location">📍 {product.seller.location}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="pd-related-section">
          <div className="pd-related-header">
            <h3>You May Also Like</h3>
            <Link href="/shop" className="pd-view-all-link">View All Products →</Link>
          </div>
          <div className="pd-related-grid">
            {relatedProducts.map((p) => (
              <Link key={p.sku} href={`/shop/${p.sku}`} className="pd-related-card">
                <img src={p.image_url || "https://placehold.co/300x300?text=No+Image"} alt={p.name} className="pd-related-img" />
                <p className="pd-related-name">{p.name}</p>
                <p className="pd-related-seller">{p.category}</p>
                <div className="pd-related-meta">
                  <span>₹{Number(p.price).toLocaleString("en-IN")}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}