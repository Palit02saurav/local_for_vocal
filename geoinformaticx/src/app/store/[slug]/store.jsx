"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import "./store.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=No+Image";

function ProductCard({ product, type = "product" }) {
  const router = useRouter();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    const result = await addToCart({ productId: product.id, type });
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
        <Link
          href={`${type === "service" ? "/services" : "/shop"}/${product.slug}`}
          className="sp-details-btn"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function StoreDetail({ sellerId }) {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // 1) the store itself (picture + location), even if it has no products yet
        const sellerRes = await axios.get(`${API_BASE}/sellers/public/${sellerId}`);
        const sellerInfo = sellerRes.data.data?.seller;

        if (!sellerInfo) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setSeller(sellerInfo);

        // 2) this seller's products
        const { data } = await axios.get(`${API_BASE}/products/public`);
        const rawProducts = data.data?.products || [];

        const sellerProducts = rawProducts.filter(
          (p) => String(p.seller?.id) === String(sellerId)
        );

        setProducts(
          sellerProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.sku,
            price: `₹${Number(p.price).toLocaleString("en-IN")}`,
            rating: p.avg_rating ?? 0,
            reviews: p.review_count ?? 0,
            img: p.image_url || PLACEHOLDER_IMG,
          }))
        );

        // this seller's services
        const svcRes = await axios.get(`${API_BASE}/services/public`);
        const rawServices = svcRes.data.data?.services || [];
        setServices(
          rawServices
            .filter((s) => String(s.seller?.id) === String(sellerId))
            .map((s) => ({
              id: s.id,
              name: s.name,
              slug: s.sku,
              price: `₹${Number(s.price).toLocaleString("en-IN")}`,
              rating: s.avg_rating ?? 0,
              reviews: s.review_count ?? 0,
              img: s.image_url || PLACEHOLDER_IMG,
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
  const heroImg = seller.profile_image_url || products[0]?.img || PLACEHOLDER_IMG;

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
            {seller.seller_type === "service"
              ? `Book trusted local services from ${storeName}, a verified service provider in your community.`
              : `Discover authentic products from ${storeName}, a trusted local seller supporting artisans and small businesses in your community.`}
          </p>
        </div>
        <img src={heroImg} alt="" className="store-hero-banner" />
      </div>

      {(seller.seller_type !== "service" || products.length > 0) && (
        <div className="store-products-section">
          <div className="store-products-header">
            <h2>Products</h2>
            <span>{products.length} Product{products.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="store-products-grid">
            {products.length === 0 && (
              <p>This store hasn't added any products yet.</p>
            )}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} type="product" />
            ))}
          </div>
        </div>
      )}

      {(seller.seller_type === "service" || services.length > 0) && (
        <div className="store-products-section">
          <div className="store-products-header">
            <h2>Services</h2>
            <span>{services.length} Service{services.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="store-products-grid">
            {services.length === 0 && (
              <p>This provider hasn't added any services yet.</p>
            )}
            {services.map((s) => (
              <ProductCard key={s.id} product={s} type="service" />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}