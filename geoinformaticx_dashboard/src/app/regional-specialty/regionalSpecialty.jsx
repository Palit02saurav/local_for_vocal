"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { findDistrictSpecialty, productMatchesSpecialty } from "@/lib/districtSpecialties";
import api from "@/lib/api";
import "./regionalSpecialty.css";

export default function RegionalSpecialty() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/products");
        setProducts(res.data.data?.products || []);
      } catch (err) {
        setError(err.message || "Could not reach the server. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const regionalSpecialty = useMemo(
    () => findDistrictSpecialty(user?.location),
    [user]
  );

  const matchingProducts = useMemo(() => {
    if (!regionalSpecialty) return [];
    return products.filter((p) => productMatchesSpecialty(p, regionalSpecialty.specialty));
  }, [products, regionalSpecialty]);

  return (
    <div className="rs-page">
      <div className="rs-header">
        <h1>Regional Specialty</h1>
        <p>Highlight your district's famous craft or produce so local buyers browsing the map can find it.</p>
      </div>

      {!loading && !user?.location && (
        <div className="rs-card rs-empty">
          <p>Add a store location to your profile so we can match you to your district's specialty.</p>
        </div>
      )}

      {!loading && user?.location && !regionalSpecialty && (
        <div className="rs-card rs-empty">
          <p>We couldn't match &ldquo;{user.location}&rdquo; to a known district yet.</p>
        </div>
      )}

      {regionalSpecialty && (
        <div className="rs-card rs-hero">
          <div className="rs-hero-icon">🏺</div>
          <div className="rs-hero-text">
            <h2>{regionalSpecialty.district} is famous for {regionalSpecialty.specialty}</h2>
            <p>Products you list that match this specialty are featured here and on the district map.</p>
          </div>
          <Link href="/products/new" className="rs-add-btn">
            + Add This Product
          </Link>
        </div>
      )}

      {loading && <div className="rs-loading">Loading your products…</div>}
      {error && <div className="rs-error">{error}</div>}

      {regionalSpecialty && !loading && !error && (
        matchingProducts.length > 0 ? (
          <div className="rs-grid">
            {matchingProducts.map((p) => (
              <div className="rs-product-card" key={p.id}>
                <span className="rs-product-badge">Regional Specialty</span>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="rs-product-img" />
                ) : (
                  <div className="rs-product-img rs-product-img-placeholder">🏺</div>
                )}
                <div className="rs-product-info">
                  <h3>{p.name}</h3>
                  <p>{p.category}</p>
                  <span className="rs-product-price">₹{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rs-card rs-empty">
            <p>You haven't listed anything matching {regionalSpecialty.specialty} yet — add one to be featured here.</p>
          </div>
        )
      )}
    </div>
  );
}