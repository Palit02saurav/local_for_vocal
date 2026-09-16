"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import "../../products/new/new-product.css";

export default function NewService() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories", { params: { type: "service" } });
        setCategories(res.data.data?.categories || []);
      } catch (err) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Service name is required.";
    if (!form.price || Number(form.price) <= 0) newErrors.price = "Enter a valid price.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await api.post("/services", form);
      router.push("/services");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to create service.");
      setSubmitting(false);
    }
  };

  const user = getCurrentUser();
  const isSeller = user?.role === "SELLER";

  return (
    <div className="np-page">
      <Link href="/services" className="np-back-link">← Back to Services</Link>
      <h1 className="np-title">Add New Service</h1>
      <p className="np-subtitle">
        {isSeller
          ? "Submit a new service for admin approval."
          : "Add a new service to the marketplace."}
      </p>

      {submitError && <div className="np-submit-error">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="np-grid">
          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">🛠️</span>
                <h3>Service Details</h3>
              </div>

              <div className="np-field">
                <label>Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Land Surveying"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <span className="np-error">{errors.name}</span>}
              </div>

              <div className="np-field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {!categoriesLoading && categories.length === 0 && (
                  <span className="np-hint">No service categories available yet. Contact admin to add one.</span>
                )}
              </div>

              <div className="np-field">
                <label>Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe what this service includes..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">💰</span>
                <h3>Pricing</h3>
              </div>
              <div className="np-field">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                />
                {errors.price && <span className="np-error">{errors.price}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="np-actions">
          <Link href="/services" className="np-cancel-btn">Cancel</Link>
          <button type="submit" className="np-save-btn" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Service"}
          </button>
        </div>
      </form>
    </div>
  );
}