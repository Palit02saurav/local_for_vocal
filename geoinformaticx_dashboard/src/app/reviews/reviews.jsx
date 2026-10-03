"use client";

import { useMemo, useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import "./reviews.css";

function Stars({ value }) {
  return (
    <span className="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "filled" : ""}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsPage({ reviews = [], loading = false }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  const isAdmin = user?.role === "SUPER_ADMIN";

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="reviews-page">
      <div className="reviews-header">
        <div>
          <h1>Reviews &amp; Ratings</h1>
          <p>See what customers are saying about your products.</p>
        </div>
        <div className="reviews-summary">
          <span className="reviews-avg">{avgRating}</span>
          <Stars value={Math.round(avgRating)} />
          <span className="reviews-count">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {loading ? (
        <p className="reviews-loading">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet.</p>
      ) : (
        <div className={`reviews-list ${isAdmin ? "reviews-grid" : ""}`}>
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <img
                src={r.product?.image_url || "https://placehold.co/60x60?text=No+Image"}
                alt={r.product?.name}
                className="review-product-img"
              />
              <div className="review-body">
                <div className="review-top-row">
                  <span className="review-product-name">{r.product?.name}</span>
                  <Stars value={r.rating} />
                </div>
                {isAdmin && (
                  <p className="review-seller">
                    Seller:{" "}
                    <strong>
                      {r.product?.seller?.store_name ||
                        r.product?.seller?.full_name ||
                        r.product?.vendor?.full_name ||
                        "—"}
                    </strong>
                  </p>
                )}
                <p className="review-customer">{r.customer_name}</p>
                {r.comment && <p className="review-comment">{r.comment}</p>}
                <p className="review-date">
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}