"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import "../products/products.css";

const PER_PAGE = 10;

function statusPillClass(status) {
  const map = {
    Active: "pp-pill-active",
    "Low Stock": "pp-pill-low",
    "Out of Stock": "pp-pill-out",
  };
  return map[status] || "";
}

function getSellerName(s) {
  return s.Seller?.store_name || s.Seller?.full_name || s.seller?.store_name || s.seller?.full_name || s.seller_name || "—";
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [seller, setSeller] = useState("All Sellers");
  const [status, setStatus] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  const loadServices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/services");
      setServices(res.data.data?.services || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category).filter(Boolean))),
    [services]
  );
  const sellers = useMemo(
    () => Array.from(new Set(services.map((s) => getSellerName(s)).filter((s) => s && s !== "—"))),
    [services]
  );

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "All Categories" || s.category === category;
      const matchesSeller = seller === "All Sellers" || getSellerName(s) === seller;
      const matchesStatus = status === "All Status" || s.status === status;
      return matchesSearch && matchesCategory && matchesSeller && matchesStatus;
    });
  }, [services, searchQuery, category, seller, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, category, seller, status]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredServices.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.status === "Active").length;
    const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : "0%");
    return [
      {
        label: "Total Services", value: total.toLocaleString("en-IN"), sub: "in marketplace",
        color: "#2f8d46", bg: "#e6f4ea",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f8d46" strokeWidth="1.8">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        ),
      },
      {
        label: "Active Services", value: active.toLocaleString("en-IN"), sub: `${pct(active)} of total`,
        color: "#e07b2a", bg: "#fdeee0",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e07b2a" strokeWidth="1.8">
            <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
            <path d="M3 9 5 3h14l2 6" />
            <path d="M9 21v-6h6v6" />
          </svg>
        ),
      },
    ];
  }, [services]);

  const toggleSelectAll = (checked) => {
    const map = {};
    if (checked) paginated.forEach((s) => (map[s.sku || s.id] = true));
    setSelected(map);
  };

  const toggleSelectOne = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setSearchQuery("");
    setCategory("All Categories");
    setSeller("All Sellers");
    setStatus("All Status");
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums = new Set([1, safePage - 1, safePage, safePage + 1, totalPages]);
    return Array.from(nums).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  };

  return (
    <main className="pp-page">
      {/* Header */}
      <div className="pp-header">
        <div>
          <h1>Services</h1>
          <p>Manage all services in your marketplace.</p>
        </div>
        <div className="pp-header-actions">
          <button className="pp-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <Link href="/services/new" className="pp-add-btn">+ Add New Service</Link>
        </div>
      </div>

      <div className="pp-stats-row">
        {stats.map((c) => (
          <div className="pp-stat-card" key={c.label}>
            <div className="pp-stat-icon" style={{ background: c.bg }}>{c.icon}</div>
            <div className="pp-stat-text">
              <p className="pp-stat-label">{c.label}</p>
              <p className="pp-stat-value" style={{ color: "#1a1a1a" }}>{c.value}</p>
              <p className="pp-stat-sub">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pp-content">
        {/* Main column */}
        <div className="pp-main-col">
          <div className="pp-toolbar">
            <div className="pp-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by service name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="pp-toolbar-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="pp-toolbar-select" value={seller} onChange={(e) => setSeller(e.target.value)}>
              <option>All Sellers</option>
              {sellers.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="pp-toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All Status</option>
              <option>Active</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
            <button className="pp-reset-btn" onClick={handleReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </div>

          <div className="pp-table-wrapper">
            {loading ? (
              <div className="pp-state-msg">Loading services…</div>
            ) : error ? (
              <div className="pp-state-msg pp-state-error">
                {error} <button className="pp-retry-btn" onClick={loadServices}>Retry</button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="pp-state-msg">No services found.</div>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th className="pp-checkbox-col">
                      <input
                        type="checkbox"
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        checked={paginated.length > 0 && paginated.every((s) => selected[s.sku || s.id])}
                      />
                    </th>
                    <th>Service</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Seller</th>
                    <th>Date Added</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const key = s.sku || s.id;
                    return (
                      <tr key={key}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selected[key]}
                            onChange={() => toggleSelectOne(key)}
                          />
                        </td>
                        <td className="pp-product-cell">
                          <img src={s.image_url || "https://placehold.co/100x100?text=No+Image"} alt={s.name} />
                          <span className="pp-product-name">{s.name}</span>
                        </td>
                        <td className="pp-sku">{s.sku}</td>
                        <td>{s.category}</td>
                        <td>{getSellerName(s)}</td>
                        <td className="pp-date-cell">
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>₹{Number(s.price || 0).toLocaleString("en-IN")}</td>
                          <td>
                            <div className="pp-action-icons">
                            <button aria-label="View">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button aria-label="Edit">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button aria-label="More">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <circle cx="12" cy="5" r="1.5" fill="#666" stroke="none" />
                                <circle cx="12" cy="12" r="1.5" fill="#666" stroke="none" />
                                <circle cx="12" cy="19" r="1.5" fill="#666" stroke="none" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && filteredServices.length > 0 && (
            <div className="pp-table-footer">
              <span className="pp-showing-text">
                Showing {(safePage - 1) * PER_PAGE + 1} to {Math.min(safePage * PER_PAGE, filteredServices.length)} of {filteredServices.length} services
              </span>
              <div className="pp-pagination">
                <button className="pp-page-btn" disabled={safePage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹</button>
                {getPageNumbers().map((n, i, arr) => (
                  <span key={n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {i > 0 && n - arr[i - 1] > 1 && <span className="pp-page-ellipsis">...</span>}
                    <button
                      className={`pp-page-btn ${safePage === n ? "active" : ""}`}
                      onClick={() => setCurrentPage(n)}
                    >
                      {n}
                    </button>
                  </span>
                ))}
                <button className="pp-page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="pp-sidebar">
          <div className="pp-filter-card">
            <div className="pp-filter-header">
              <h3>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
              </h3>
              <button className="pp-clear-all" onClick={handleReset}>Clear All</button>
            </div>

            <div className="pp-filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search services..."
                className="pp-filter-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="pp-filter-group">
              <label>Category</label>
              <select className="pp-filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All Categories</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="pp-filter-group">
              <label>Seller</label>
              <select className="pp-filter-select" value={seller} onChange={(e) => setSeller(e.target.value)}>
                <option>All Sellers</option>
                {sellers.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="pp-filter-group">
              <label>Status</label>
              <select className="pp-filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>

            <button className="pp-apply-btn" onClick={loadServices}>Refresh</button>
          </div>

          <div className="pp-summary-card">
            <h3>Service Summary</h3>
            {stats.map((s) => (
              <div className="pp-summary-row" key={s.label}>
                <span className="pp-summary-dot" style={{ background: s.color }} />
                <span className="pp-summary-label">{s.label}</span>
                <span className="pp-summary-value">{s.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}