"use client";

import { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import "../products.css";

function getSellerName(p) {
  return (
    p.Seller?.store_name || p.Seller?.full_name ||
    p.seller?.store_name || p.seller?.full_name ||
    "—"
  );
}

function stockLevel(stock, threshold) {
  const s = Number(stock) || 0;
  const t = Number(threshold) || 0;
  if (s === 0) return { label: "Out of Stock", cls: "pp-pill-out" };
  if (s <= t) return { label: "Low Stock", cls: "pp-pill-low" };
  return { label: "In Stock", cls: "pp-pill-active" };
}

export default function Inventory() {
  const [user, setUser] = useState(null);
  const isAdmin = user?.role === "SUPER_ADMIN";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/products");
      setProducts(res.data.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (levelFilter === "All") return true;
      const level = stockLevel(p.stock, p.low_stock_threshold).label;
      return level === levelFilter;
    });
  }, [products, searchQuery, levelFilter]);

  const summary = useMemo(() => {
    const inStock = products.filter((p) => stockLevel(p.stock, p.low_stock_threshold).label === "In Stock").length;
    const lowStock = products.filter((p) => stockLevel(p.stock, p.low_stock_threshold).label === "Low Stock").length;
    const outOfStock = products.filter((p) => stockLevel(p.stock, p.low_stock_threshold).label === "Out of Stock").length;
    return { total: products.length, inStock, lowStock, outOfStock };
  }, [products]);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Inventory</h1>
          <p>
            {isAdmin
              ? "Track stock levels across all sellers in your marketplace."
              : "Track stock levels for your listed products."}
          </p>
        </div>
      </div>

      <div className="pp-stats-row">
        <div className="pp-stat-card">
          <div className="pp-stat-text">
            <p className="pp-stat-label">Total Products</p>
            <p className="pp-stat-value">{summary.total}</p>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-text">
            <p className="pp-stat-label">In Stock</p>
            <p className="pp-stat-value" style={{ color: "#2f8d46" }}>{summary.inStock}</p>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-text">
            <p className="pp-stat-label">Low Stock</p>
            <p className="pp-stat-value" style={{ color: "#e07b2a" }}>{summary.lowStock}</p>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-text">
            <p className="pp-stat-label">Out of Stock</p>
            <p className="pp-stat-value" style={{ color: "#e63946" }}>{summary.outOfStock}</p>
          </div>
        </div>
      </div>

      <div className="pp-toolbar">
        <div className="pp-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by product name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="pp-toolbar-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option>All</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      <div className="pp-table-wrapper">
        {loading ? (
          <div className="pp-state-msg">Loading inventory…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadProducts}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-state-msg">No products found.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                {isAdmin && <th>Seller</th>}
                <th>Stock</th>
                <th>Low Stock Threshold</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const level = stockLevel(p.stock, p.low_stock_threshold);
                return (
                  <tr key={p.id}>
                    <td className="pp-product-cell">
                      <img src={p.image_url || "https://placehold.co/100x100?text=No+Image"} alt={p.name} />
                      <span className="pp-product-name">{p.name}</span>
                    </td>
                    <td className="pp-sku">{p.sku}</td>
                    {isAdmin && <td>{getSellerName(p)}</td>}
                    <td>{p.stock}</td>
                    <td>{p.low_stock_threshold ?? "—"}</td>
                    <td>
                      <span className={`pp-pill ${level.cls}`}>{level.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}