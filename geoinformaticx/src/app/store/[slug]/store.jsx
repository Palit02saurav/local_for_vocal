"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import "./store.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=No+Image";

function ProductCard({ product }) {
  const router = useRouter();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    const result = await addToCart({ productId: product.id, type: "product" });
    if (result.requiresLogin) {
      router.push(`/login?redirect=/store`);
    }
  };

  return (
    <div className="sp-card">
      <div className="sp-img-wrapper">
        <img src={product.img} alt={product.name} className="sp-img" />
      </div>
      <div className="sp-info">
        <p className="sp-name">{product.name}</p>
        <p className="sp-price">{product.price}</p>
        <p className="sp-rating">⭐ {product.rating} ({product.reviews})</p>
        <button className="sp-add-cart-btn" onClick={handleAddToCart}>
          🛒 Add to Cart
        </button>
        <Link href={`/shop/${product.slug}`} className="sp-details-btn">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function StoreDetail({ sellerId }) {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/products/public`);
        const rawProducts = data.data?.products || [];

        const sellerProducts = rawProducts.filter(
          (p) => String(p.seller?.id) === String(sellerId)
        );

        if (sellerProducts.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const sellerInfo = sellerProducts[0].seller;
        setSeller(sellerInfo);

        setProducts(
          sellerProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.sku,
            price: `₹${Number(p.price).toLocaleString("en-IN")}`,
            rating: 4.7,
            reviews: 0,
            img: p.image_url || PLACEHOLDER_IMG,
          }))
        );
      } catch (err) {
        console.error("Failed to load store:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sellerId]);

  if (loading) {
    return <div className="store-loading">Loading store...</div>;
  }

  if (notFound || !seller) {
    return (
      <div className="store-not-found">
        <h2>Store not found</h2>
        <Link href="/business">← Back to Local Businesses</Link>
      </div>
    );
  }

  const storeName = seller.store_name || seller.full_name || "Local Store";
  const heroImg = products[0]?.img || PLACEHOLDER_IMG;

  return (
    <main className="store-page">
      <div className="store-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>
        <Link href="/business">Local Businesses</Link> <span>›</span>
        <span>{storeName}</span>
      </div>

      <div className="store-hero-section">
        <div className="store-logo-wrapper">
          <img src={heroImg} alt={storeName} className="store-logo" />
        </div>
        <div className="store-hero-info">
          <h1 className="store-name">{storeName}</h1>
          {seller.location && (
            <p className="store-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {seller.location}
            </p>
          )}
          <p className="store-description">
            Discover authentic products from {storeName}, a trusted local seller
            supporting artisans and small businesses in your community.
          </p>
        </div>
        <img src={heroImg} alt="" className="store-hero-banner" />
      </div>

      <div className="store-products-section">
        <div className="store-products-header">
          <h2>Products</h2>
          <span>{products.length} Product{products.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="store-products-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </main>
  );
}