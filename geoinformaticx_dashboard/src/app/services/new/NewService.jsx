"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { districtSpecialties } from "@/lib/districtSpecialties";
import "../../products/new/new-product.css";

const EMPTY_SERVICE_FORM = {
  name: "",
  category: "",
  description: "",
  price: "",
  price_type: "Fixed",
  price_unit: "",
  duration: "",
  coverage_areas: [],
  requirements: "",
  image_url: "",
};

let serviceDraftCounter = 0;
const makeServiceDraft = (overrides = {}) => ({
  key: `service-draft-${++serviceDraftCounter}`,
  form: { ...EMPTY_SERVICE_FORM, ...overrides },
});

export default function NewService() {
  const router = useRouter();

  const [form, setForm] = useState({ ...EMPTY_SERVICE_FORM });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [drafts, setDrafts] = useState(() => [makeServiceDraft()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      handleChange("image_url", url);
    } catch (err) {
      setSubmitError("Image upload failed. Try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const toggleCoverageArea = (district) => {
    setForm((f) => {
      const has = f.coverage_areas.includes(district);
      return {
        ...f,
        coverage_areas: has
          ? f.coverage_areas.filter((d) => d !== district)
          : [...f.coverage_areas, district],
      };
    });
  };  

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

  const captureActive = (list = drafts) =>
    list.map((d, i) => (i === activeIndex ? { ...d, form } : d));

  const loadDraft = (draft) => {
    setForm(draft.form);
    setErrors({});
  };

  const switchDraft = (idx) => {
    if (idx === activeIndex) return;
    const snapshot = captureActive();
    setDrafts(snapshot);
    setActiveIndex(idx);
    loadDraft(snapshot[idx]);
  };

  const addDraft = () => {
    const snapshot = captureActive();
    // carry the category over — sellers often add several services of the same kind
    const fresh = makeServiceDraft({ category: form.category });
    const next = [...snapshot, fresh];
    setDrafts(next);
    setActiveIndex(next.length - 1);
    loadDraft(fresh);
    setSubmitError("");
  };

  const duplicateDraft = () => {
    const snapshot = captureActive();
    const source = snapshot[activeIndex];
    const copy = {
      ...makeServiceDraft(),
      form: { ...source.form, name: "" }, // name should be distinct
    };
    const next = [...snapshot, copy];
    setDrafts(next);
    setActiveIndex(next.length - 1);
    loadDraft(copy);
    setSubmitError("");
  };

  const removeDraft = (idx) => {
    if (drafts.length === 1) return;
    const snapshot = captureActive();
    const next = snapshot.filter((_, i) => i !== idx);
    const nextActive =
      idx === activeIndex ? Math.max(0, idx - 1) : idx < activeIndex ? activeIndex - 1 : activeIndex;
    setDrafts(next);
    setActiveIndex(nextActive);
    loadDraft(next[nextActive]);
    setSubmitError("");
  };

  const validateForm = (f) => {
    const newErrors = {};
    if (!f.name.trim()) newErrors.name = "Service name is required.";
    if (!f.price || Number(f.price) <= 0) newErrors.price = "Enter a valid price.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const all = captureActive();
    setDrafts(all);

    for (let i = 0; i < all.length; i++) {
      const errs = validateForm(all[i].form);
      if (Object.keys(errs).length > 0) {
        setActiveIndex(i);
        loadDraft(all[i]);
        setErrors(errs);
        setSubmitError(
          all.length === 1
            ? "Please fix the highlighted fields."
            : `Service ${i + 1} has missing or invalid fields.`
        );
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    const failures = [];
    for (let i = 0; i < all.length; i++) {
      try {
        const payload = {
          ...all[i].form,
          coverage_areas: all[i].form.coverage_areas.join(","),
        };
        await api.post("/services", payload);
      } catch (err) {
        failures.push({
          index: i,
          draft: all[i],
          message: err.response?.data?.message || "Failed to create service.",
        });
      }
    }

    if (failures.length === 0) {
      router.push("/services");
      return;
    }

    const saved = all.length - failures.length;
    const remaining = failures.map((f) => f.draft);
    setDrafts(remaining);
    setActiveIndex(0);
    loadDraft(remaining[0]);
    setSubmitError(
      `${saved} of ${all.length} services saved. Still to fix: ` +
        failures.map((f) => `Service ${f.index + 1} — ${f.message}`).join(" | ")
    );
    setSubmitting(false);
  };

  const user = getCurrentUser();
  const isSeller = user?.role === "SELLER";

  return (
    <div className="np-page">
      <Link href="/services" className="np-back-link">← Back to Services</Link>
      <h1 className="np-title">Add New Service</h1>
      <p className="np-subtitle">
        {isSeller
          ? "Submit one or more services for admin approval."
          : "Add one or more services to the marketplace."}
      </p>

      <div className="np-drafts-bar">
        <div className="np-draft-tabs">
          {drafts.map((d, i) => {
            const label = (i === activeIndex ? form.name : d.form.name)?.trim() || `Service ${i + 1}`;
            return (
              <div key={d.key} className={`np-draft-tab ${i === activeIndex ? "active" : ""}`}>
                <button type="button" onClick={() => switchDraft(i)} title={label}>
                  <span className="np-draft-num">{i + 1}</span>
                  <span className="np-draft-label">{label}</span>
                </button>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    className="np-draft-remove"
                    onClick={() => removeDraft(i)}
                    aria-label={`Remove ${label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="np-draft-actions">
          <button type="button" className="np-draft-add" onClick={addDraft}>
            + Add another service
          </button>
          <button type="button" className="np-draft-dup" onClick={duplicateDraft}>
            ⧉ Duplicate this one
          </button>
        </div>
      </div>

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

              <div className="np-field">
                <label>Service Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {imageUploading && <span className="np-hint">Uploading…</span>}
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" style={{ width: 100, height: 100, objectFit: "cover", marginTop: 8, borderRadius: 8 }} />
                )}
              </div>

              <div className="np-field">
                <label>Turnaround Time</label>
                <input
                  type="text"
                  placeholder="e.g., 3-5 business days"
                  value={form.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                />
              </div>

              <div className="np-field">
                <label>What the customer needs to provide</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Site access, land documents, photo ID..."
                  value={form.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                />
              </div>

              <div className="np-field">
                <label>Areas Served</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                  {Object.keys(districtSpecialties).map((district) => (
                    <label key={district} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        checked={form.coverage_areas.includes(district)}
                        onChange={() => toggleCoverageArea(district)}
                      />
                      {district}
                    </label>
                  ))}
                </div>
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

              <div className="np-field">
                <label>Pricing Type</label>
                <select
                  value={form.price_type}
                  onChange={(e) => handleChange("price_type", e.target.value)}
                >
                  <option value="Fixed">Fixed price</option>
                  <option value="Starting From">Starting from</option>
                  <option value="Per Unit">Per unit</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {form.price_type === "Per Unit" && (
                <div className="np-field">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., per acre, per sq. ft"
                    value={form.price_unit}
                    onChange={(e) => handleChange("price_unit", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="np-actions">
          <Link href="/services" className="np-cancel-btn">Cancel</Link>
          <button type="submit" className="np-save-btn" disabled={submitting}>
            {submitting
              ? `Saving ${drafts.length} service${drafts.length > 1 ? "s" : ""}...`
              : `💾 Save ${drafts.length > 1 ? `${drafts.length} Services` : "Service"}`}
          </button>
        </div>
      </form>
    </div>
  );
}