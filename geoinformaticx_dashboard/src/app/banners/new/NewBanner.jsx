"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import "../../products/new/new-product.css";

export default function NewBanner() {
  const router = useRouter();
  const isSeller = getCurrentUser()?.role === "SELLER";

  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Banner title is required.";
    if (!image) newErrors.image = "Banner image is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const imageUrl = image ? await uploadImage(image) : "";

      await api.post("/banners", {
        title: title.trim(),
        image_url: imageUrl,
        link_url: linkUrl.trim() || null,
      });

      if (isSeller) {
        setSubmitSuccess("Banner submitted! It will appear once an admin approves it.");
        setTitle("");
        setLinkUrl("");
        setImage(null);
        setPreview(null);
        setSubmitting(false);
      } else {
        router.push("/banners");
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to create banner.");
      setSubmitting(false);
    }
  };

  return (
    <div className="np-page">
      <Link href="/banners" className="np-back-link">← Back to Banners</Link>
      <h1 className="np-title">Add New Banner</h1>
      <p className="np-subtitle">
        {isSeller
          ? "Your banner will be reviewed by an admin before it goes live."
          : "Upload a new promotional banner for your marketplace."}
      </p>

      {submitError && <div className="np-submit-error">{submitError}</div>}

      {submitSuccess ? (
        <div className="np-card np-consent-card">
          <p style={{ color: "#2f8d46", fontWeight: 600, margin: 0 }}>{submitSuccess}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="np-card">
            <div className="np-card-title">
              <span className="np-card-icon">🖼️</span>
              <h3>Banner Details</h3>
            </div>

            <div className="np-field">
              <label>Banner Title *</label>
              <input
                type="text"
                placeholder="Enter banner title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: "" })); }}
              />
              {errors.title && <span className="np-error">{errors.title}</span>}
            </div>

            <div className="np-field">
              <label>Link URL (optional)</label>
              <input
                type="text"
                placeholder="/shop or https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            <div className="np-field">
              <label>Banner Image *</label>
              <div className="np-dropzone">
                <span className="np-dropzone-icon">☁️</span>
                <p>Drag & drop image here</p>
                <p className="np-dropzone-or">or</p>
                <label className="np-choose-files-btn">
                  Choose File
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </label>
                <p className="np-dropzone-note">JPG, PNG or WEBP (Max. 5MB)</p>
              </div>
              {errors.image && <span className="np-error">{errors.image}</span>}
              {preview && (
                <div className="np-image-previews">
                  <div className="np-image-preview" style={{ width: 160, height: 90 }}>
                    <img src={preview} alt="Banner preview" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="np-actions">
            <Link href="/banners" className="np-cancel-btn">Cancel</Link>
            <button type="submit" className="np-save-btn" disabled={submitting}>
              {submitting ? "Saving..." : "💾 Save Banner"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}