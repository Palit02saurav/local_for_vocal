"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import "../../products/new/new-product.css";

export default function NewServiceCategory() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  const [image, setImage] = useState(null); // { file, previewUrl }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleFile = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removeImage = () => setImage(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Category name is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await api.post("/categories", {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        image_url: image?.file ? await uploadImage(image.file) : "",
        type: "service",
      });

      router.push("/categories");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to create service category.");
      setSubmitting(false);
    }
  };

  return (
    <div className="np-page">
      <Link href="/categories" className="np-back-link">
        ← Back to Categories
      </Link>
      <h1 className="np-title">Add New Service Category</h1>
      <p className="np-subtitle">Create a new category sellers can choose from when adding a service.</p>

      {submitError && <div className="np-submit-error">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="np-grid">
          {/* Left column */}
          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">📋</span>
                <h3>Category Information</h3>
              </div>

              <div className="np-field">
                <label>Category Name *</label>
                <input
                  type="text"
                  placeholder="Enter category name (e.g., Plumbing)"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <span className="np-error">{errors.name}</span>}
              </div>

              <div className="np-field">
                <label>Description *</label>
                <textarea
                  rows={5}
                  placeholder="Briefly describe this category..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
                {errors.description && <span className="np-error">{errors.description}</span>}
              </div>
            </div>

            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">🖼️</span>
                <h3>Category Image</h3>
              </div>
              <p className="np-images-hint">Upload a representative image for this category.</p>

              <div
                className={`np-dropzone ${dragActive ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <span className="np-dropzone-icon">☁️</span>
                <p>Drag & drop an image here</p>
                <p className="np-dropzone-or">or</p>
                <label className="np-choose-files-btn">
                  Choose File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => handleFile(e.target.files)}
                  />
                </label>
                <p className="np-dropzone-note">JPG, PNG or WEBP (Max. 5MB)</p>
              </div>

              {image && (
                <div className="np-image-previews">
                  <div className="np-image-preview">
                    <img src={image.previewUrl} alt="Category preview" />
                    <button type="button" onClick={removeImage} aria-label="Remove image">✕</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">🟢</span>
                <h3>Category Status</h3>
              </div>
              <div className="np-field">
                <label>Status *</label>
                <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="np-hint">Inactive categories won't appear in the seller's service category dropdown</span>
              </div>
            </div>
          </div>
        </div>

        <div className="np-actions">
          <Link href="/categories" className="np-cancel-btn">Cancel</Link>
          <button type="submit" className="np-save-btn" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Service Category"}
          </button>
        </div>
      </form>
    </div>
  );
}