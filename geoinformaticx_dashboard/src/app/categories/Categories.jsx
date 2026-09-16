"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import "../products/products.css";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Categories</h1>
          <p>All product categories in your marketplace.</p>
        </div>
        <Link href="/categories/new" className="pp-add-btn">
          + Add New Category
        </Link>
      </div>

      <div className="pp-toolbar">
        <div className="pp-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-table-wrapper">
        {loading ? (
          <div className="pp-state-msg">Loading categories…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadCategories}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-state-msg">No categories found.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="pp-product-cell">
                    <img
                      src={c.image_url || "https://placehold.co/60x60?text=No+Image"}
                      alt={c.name}
                    />
                  </td>
                  <td className="pp-product-name">{c.name}</td>
                  <td>{c.description}</td>
                  <td>
                    <span className={`pp-pill ${c.status === "Active" ? "pp-pill-active" : "pp-pill-out"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}