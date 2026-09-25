"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import "./products.css";

const PER_PAGE = 10;

function statusPillClass(status) {
  const map = {
    Active: "pp-pill-active",
    "Low Stock": "pp-pill-low",
    "Out of Stock": "pp-pill-out",
    Pending: "pp-pill-pending",
  };
  return map[status] || "";
}

function getSellerName(p) {
  return p.Seller?.store_name || p.Seller?.full_name || p.seller?.store_name || p.seller?.full_name || p.vendor?.full_name || p.seller_name || "—";
}

export default function Products({
  productType = null,
  approvalStatus = null,
  deliveryType = null,
  title = "Products",
  subtitle = "Manage all products in your marketplace.",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [seller, setSeller] = useState("All Sellers");
const [status, setStatus] = useState("All Status");
const [currentPage, setCurrentPage] = useState(1);

const [currentUser, setCurrentUser] = useState(null);
const isSeller = currentUser?.role === "SELLER";
useEffect(() => {
  setCurrentUser(getCurrentUser());
}, []);

const [showFilters, setShowFilters] = useState(false);
const [deletingId, setDeletingId] = useState(null);

const [editingProduct, setEditingProduct] = useState(null);
const [editForm, setEditForm] = useState(null);
const [editImageFile, setEditImageFile] = useState(null);
const [editSubmitting, setEditSubmitting] = useState(false);
const [editError, setEditError] = useState("");
const [editSuccess, setEditSuccess] = useState("");

const openEditModal = (product) => {
  setEditError("");
  setEditSuccess("");
  setEditImageFile(null);
  setEditForm({
    category: product.category || "",
    price: product.price ?? "",
    stock: product.stock ?? "",
    description: product.description || "",
    image_url: product.image_url || "",
  });
  setEditingProduct(product);
};

const closeEditModal = () => {
  setEditingProduct(null);
  setEditForm(null);
  setEditImageFile(null);
  setEditError("");
};

useEffect(() => {
  document.body.style.overflow = editingProduct ? "hidden" : "";
  return () => { document.body.style.overflow = ""; };
}, [editingProduct]);

const handleEditFieldChange = (field, value) => {
  setEditForm((f) => ({ ...f, [field]: value }));
};

const submitEditRequest = async (e) => {
  e.preventDefault();
  if (!editingProduct || !editForm) return;
  setEditSubmitting(true);
  setEditError("");
  try {
    let image_url = editForm.image_url;
    if (editImageFile) {
      image_url = await uploadImage(editImageFile);
    }
    await api.patch(`/products/${editingProduct.id}/request-edit`, {
      category: editForm.category,
      price: Number(editForm.price),
      stock: Number(editForm.stock),
      description: editForm.description,
      image_url,
    });
    setEditSuccess("Edit request submitted — a superadmin will review it before it goes live.");
    setTimeout(() => closeEditModal(), 1500);
  } catch (err) {
    setEditError(err.response?.data?.message || err.message || "Could not submit the edit request.");
  } finally {
    setEditSubmitting(false);
  }
};

const handleDelete = async (product) => {
  if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
  setDeletingId(product.id);
  try {
    await api.delete(`/products/${product.id}`);
    setProducts((prev) => prev.filter((x) => x.id !== product.id));
  } catch (err) {
    alert(err.response?.data?.message || err.message || "Could not delete the product.");
  } finally {
    setDeletingId(null);
  }
};

const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (productType) params.productType = productType;
      if (approvalStatus) params.approvalStatus = approvalStatus;
      if (deliveryType) params.deliveryType = deliveryType;
      const res = await api.get("/products", { params });
      setProducts(res.data.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
 }, [productType, approvalStatus, deliveryType]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );
  const sellers = useMemo(
    () => Array.from(new Set(products.map((p) => getSellerName(p)).filter((s) => s && s !== "—"))),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "All Categories" || p.category === category;
      const matchesSeller = seller === "All Sellers" || getSellerName(p) === seller;
      const matchesStatus = status === "All Status" || p.status === status;
      return matchesSearch && matchesCategory && matchesSeller && matchesStatus;
    });
  }, [products, searchQuery, category, seller, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, category, seller, status]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredProducts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "Active").length;
    const outOfStock = products.filter((p) => p.status === "Out of Stock").length;
    const lowStock = products.filter((p) => p.status === "Low Stock").length;
    const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : "0%");
    return [
      {
        label: "Total Products", value: total.toLocaleString("en-IN"), sub: "in marketplace",
        color: "#2f8d46", bg: "#e6f4ea",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f8d46" strokeWidth="1.8">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: "Active Products", value: active.toLocaleString("en-IN"), sub: `${pct(active)} of total`,
        color: "#e07b2a", bg: "#fdeee0",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e07b2a" strokeWidth="1.8">
            <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
            <path d="M3 9 5 3h14l2 6" />
            <path d="M9 21v-6h6v6" />
          </svg>
        ),
      },
      {
        label: "Out of Stock", value: outOfStock.toLocaleString("en-IN"), sub: `${pct(outOfStock)} of total`,
        color: "#7b5fc4", bg: "#f0ecfa",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b5fc4" strokeWidth="1.8">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: "Low Stock", value: lowStock.toLocaleString("en-IN"), sub: `${pct(lowStock)} of total`,
        color: "#e63946", bg: "#fdeaec",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="1.8">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    ];
  }, [products]);

  const toggleSelectAll = (checked) => {
    const map = {};
    if (checked) paginated.forEach((p) => (map[p.sku || p.id] = true));
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
          <h1>{title}</h1>
          <p>{subtitle}</p>
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
         <Link
            href={deliveryType === "Fresh" ? "/fresh-delivery/new" : "/products/new"}
            className="pp-add-btn"
          >
            {deliveryType === "Fresh" ? "+ Add Fresh Product" : "+ Add New Product"}
          </Link>
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

      <div className={`pp-content ${showFilters ? "" : "pp-no-sidebar"}`}>
        {/* Main column */}
        <div className="pp-main-col">
          {/* Search + quick filters */}
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

          {/* Table */}
          <div className="pp-table-wrapper">
            {loading ? (
              <div className="pp-state-msg">Loading products…</div>
            ) : error ? (
              <div className="pp-state-msg pp-state-error">
                {error} <button className="pp-retry-btn" onClick={loadProducts}>Retry</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="pp-state-msg">No products found.</div>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th className="pp-checkbox-col">
                      <input
                        type="checkbox"
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        checked={paginated.length > 0 && paginated.every((p) => selected[p.sku || p.id])}
                      />
                    </th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Seller</th>
                    <th>Date Added</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => {
                    const key = p.sku || p.id;
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
                          <img src={p.image_url || "https://placehold.co/100x100?text=No+Image"} alt={p.name} />
                          <span className="pp-product-name">{p.name}</span>
                        </td>
                        <td className="pp-sku">{p.sku}</td>
                        <td>{p.category}</td>
                        <td>{getSellerName(p)}</td>
                        <td className="pp-date-cell">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>₹{Number(p.price || 0).toLocaleString("en-IN")}</td>
                        <td>{p.stock}</td>
                        <td>
                          {approvalStatus === "Pending" ? (
                            <span className="pp-pill pp-pill-pending">Pending Approval</span>
                          ) : (
                            <span className={`pp-pill ${statusPillClass(p.status)}`}>{p.status}</span>
                          )}
                        </td>
                        <td>
                          <div className="pp-action-icons">
                            <button aria-label="View">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              aria-label="Edit"
                              onClick={() => (isSeller ? openEditModal(p) : undefined)}
                              disabled={!isSeller}
                              title={isSeller ? "Request an edit" : undefined}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              aria-label="Delete"
                              className="pp-delete-btn"
                              title="Delete product"
                              disabled={deletingId === p.id}
                              onClick={() => handleDelete(p)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                            <button
                              aria-label="More"
                              onClick={() => setShowFilters((v) => !v)}
                            >
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

          {/* Footer: showing + pagination */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="pp-table-footer">
              <span className="pp-showing-text">
                Showing {(safePage - 1) * PER_PAGE + 1} to {Math.min(safePage * PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
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
        {showFilters && (
        <aside className="pp-sidebar">
          <div className="pp-filter-card">
            <div className="pp-filter-header">
              <h3>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
              </h3>
              <div className="pp-filter-actions">
                <button className="pp-clear-all" onClick={handleReset}>Clear All</button>
                <button
                  type="button"
                  className="pp-filter-close"
                  aria-label="Close filters"
                  onClick={() => setShowFilters(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="pp-filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search products..."
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

            <button className="pp-apply-btn" onClick={loadProducts}>Refresh</button>
          </div>

          <div className="pp-summary-card">
            <h3>Product Summary</h3>
            {stats.map((s) => (
              <div className="pp-summary-row" key={s.label}>
                <span className="pp-summary-dot" style={{ background: s.color }} />
                <span className="pp-summary-label">{s.label}</span>
                <span className="pp-summary-value">{s.value}</span>
              </div>
            ))}
          </div>
        </aside>
        )}
      </div>

      {editingProduct && editForm && typeof document !== "undefined" &&
        createPortal(
          <div className="pp-edit-overlay" onClick={closeEditModal}>
            <div className="pp-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-edit-modal-header">
              <h3>Edit "{editingProduct.name}"</h3>
              <button className="pp-edit-close" onClick={closeEditModal} aria-label="Close">✕</button>
            </div>
            <p className="pp-edit-modal-sub">
              Changes are sent to the superadmin for approval and won't go live until approved.
            </p>

            <form onSubmit={submitEditRequest} className="pp-edit-form">
              <div className="pp-edit-field">
                <label>Product Name (locked)</label>
                <input type="text" value={editingProduct.name} disabled />
              </div>

              <div className="pp-edit-field">
                <label>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => handleEditFieldChange("category", e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pp-edit-field-row">
                <div className="pp-edit-field">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => handleEditFieldChange("price", e.target.value)}
                    required
                  />
                </div>
                <div className="pp-edit-field">
                  <label>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => handleEditFieldChange("stock", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pp-edit-field">
                <label>Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => handleEditFieldChange("description", e.target.value)}
                />
              </div>

              <div className="pp-edit-field">
                <label>Product Image</label>
                <div className="pp-edit-image-row">
                  <img
                    src={editImageFile ? URL.createObjectURL(editImageFile) : (editForm.image_url || "https://placehold.co/60x60?text=No+Image")}
                    alt="Preview"
                    className="pp-edit-image-preview"
                  />
                  <label className="pp-edit-upload-btn">
                    Change Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {editError && <div className="pp-edit-error">{editError}</div>}
              {editSuccess && <div className="pp-edit-success">{editSuccess}</div>}

              <div className="pp-edit-actions">
                <button type="button" className="pp-edit-cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="pp-edit-submit-btn" disabled={editSubmitting}>
                  {editSubmitting ? "Submitting..." : "Update Details"}
                </button>
              </div>
            </form>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}