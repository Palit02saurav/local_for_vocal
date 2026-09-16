"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";
import { useState, useEffect } from "react";
import "./service.css";

export default function ServiceDetail({ service }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  useEffect(() => {
    getWishlist().then((list) => {
      const match = list.find((i) => i.id === service.id && i.type === "service");
      setWishlisted(!!match);
      setWishlistItemId(match?.wishlistItemId || null);
    });
  }, [service.id]);

  const toggleWishlist = async () => {
    if (wishlisted) {
      await removeFromWishlist(wishlistItemId);
      setWishlisted(false);
      setWishlistItemId(null);
    } else {
      const result = await addToWishlist({ productId: service.id, type: "service" });
      if (result.requiresLogin) {
        router.push(`/login?redirect=/services/${service.slug}`);
        return;
      }
      const list = await getWishlist();
      const match = list.find((i) => i.id === service.id && i.type === "service");
      setWishlistItemId(match?.wishlistItemId || null);
      setWishlisted(true);
    }
  };

  const handleBookNow = async () => {
    const result = await addToCart({ productId: service.id, type: "service" });
    if (result.requiresLogin) {
      router.push(`/login?redirect=/services/${service.slug}`);
    }
  };

  return (
    <main className="sd-page">
      <div className="sd-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>{" "}
        <Link href="/services">Services</Link> <span>›</span>{" "}
        <span>{service.name}</span>
      </div>

      <div className="sd-layout">
        <div className="sd-image-wrapper">
          <img src={service.img} alt={service.name} className="sd-image" />
        </div>

        <div className="sd-details">
          <h1 className="sd-name">{service.name}</h1>

          <p className="sd-seller">By {service.seller}</p>

          <div className="sd-meta">
            {service.location && <span className="sd-distance">📍 {service.location}</span>}
            <span className="sd-category">{service.category}</span>
          </div>

          <h3 className="sd-section-title">About This Service</h3>
          <p className="sd-description">{service.description}</p>

          <div className="sd-price-row">
            <span className="sd-price-label">Price</span>
            <span className="sd-price-value">₹{service.price.toLocaleString("en-IN")}</span>
          </div>

          <div className="sd-actions">
            <button className="sd-book-btn" onClick={handleBookNow}>
              📋 Book Now
            </button>
            <button
              className={`sd-wishlist-btn ${wishlisted ? "active" : ""}`}
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
            >
              {wishlisted ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}