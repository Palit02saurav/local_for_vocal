"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import api from "@/lib/api";
import "../products/products.css";

export default function Categories({
  type = "product",
  title = "Categories",
  subtitle = "All product categories in your marketplace.",
  addHref = "/categories/new",
  addLabel = "+ Add New Category",
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories", { params: { type } });
      setCategories(res.data.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [type]);

  const filtered = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      status: category.status || "Active",
    });
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setEditForm(null);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((f) => ({ ...f, [field]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSaving(true);
    try {
      await api.patch(`/categories/${editingCategory.id}`, editForm);
      await loadCategories();
      closeEditModal();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Could not update category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setDeletingId(category.id);
    try {
      await api.delete(`/categories/${category.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Could not delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Link href={addHref} className="pp-add-btn">
          {addLabel}
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
                <th>Action</th>
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
                  <td>
                    <div className="pp-action-icons">
                      <button aria-label="Edit" onClick={() => openEditModal(c)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingCategory && editForm && typeof document !== "undefined" &&
        createPortal(
          <div className="pp-edit-overlay" onClick={closeEditModal}>
            <div className="pp-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pp-edit-modal-header">
                <h3>Edit "{editingCategory.name}"</h3>
                <button className="pp-edit-close" onClick={closeEditModal} aria-label="Close">✕</button>
              </div>

              <form onSubmit={submitEdit} className="pp-edit-form">
                <div className="pp-edit-field">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFieldChange("name", e.target.value)}
                    required
                  />
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
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={editForm.image_url}
                    onChange={(e) => handleEditFieldChange("image_url", e.target.value)}
                  />
                </div>

                <div className="pp-edit-field">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditFieldChange("status", e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <button type="submit" className="pp-add-btn" disabled={saving} style={{ width: "100%", justifyContent: "center" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}