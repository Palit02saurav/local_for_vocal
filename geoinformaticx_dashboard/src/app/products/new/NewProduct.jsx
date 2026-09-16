"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import "./new-product.css";

export default function NewProduct() {
  const router = useRouter();
  const descRef = useRef(null);

const [currentUser, setCurrentUser] = useState(null);
  const isSeller = currentUser?.role === "SELLER";

  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data?.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    sellerId: "",
    description: "",
    price: "",
    stock: "",
    lowStockThreshold: "",
    status: "Active",
    productType: "Regular",
    brand: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [sellerConsent, setSellerConsent] = useState(false);

  const [images, setImages] = useState([]); // { file, previewUrl }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const errorBannerRef = useRef(null);

  const generateSku = () => `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

   
    if (user?.role === "SELLER") {
      setForm((f) => ({ ...f, sellerId: user.id }));
      setLoadingSellers(false);
      return;
    }

    const loadSellers = async () => {
      try {
        const res = await api.get("/sellers");
        setSellers(res.data.data?.sellers || []);
      } catch (err) {
        console.error("Failed to load sellers:", err);
      } finally {
        setLoadingSellers(false);
      }
    };
    loadSellers();
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const [showRegionalConfirm, setShowRegionalConfirm] = useState(false);

  const handleProductTypeChange = (value) => {
    if (value === "Regional Famous") {
      setShowRegionalConfirm(true);
      return;
    }
    handleChange("productType", value);
  };

  const confirmRegionalType = () => {
    handleChange("productType", "Regional Famous");
    setShowRegionalConfirm(false);
  };

  const cancelRegionalType = () => {
    setShowRegionalConfirm(false);
  };
  const addTag = (raw) => {
    const cleaned = raw.trim().replace(/^#+/, ""); // strip any # the user typed themselves
    if (!cleaned) return;
    const tag = `#${cleaned}`;
    if (!tags.includes(tag)) {
      setTags((t) => [...t, tag]);
    }
    setTagInput("");
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((t) => t.slice(0, -1));
    }
  };

  const removeTag = (idx) => {
    setTags((t) => t.filter((_, i) => i !== idx));
  };

  const applyFormat = (tag) => {
    const textarea = descRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.description.slice(start, end);

    let wrapped;
    if (tag === "bold") wrapped = `**${selected || "bold text"}**`;
    else if (tag === "italic") wrapped = `_${selected || "italic text"}_`;
    else if (tag === "underline") wrapped = `__${selected || "underlined text"}__`;
    else if (tag === "ul") wrapped = `\n- ${selected || "list item"}`;
    else if (tag === "ol") wrapped = `\n1. ${selected || "list item"}`;
    else if (tag === "link") wrapped = `[${selected || "link text"}](url)`;
    else wrapped = selected;

    const newValue = form.description.slice(0, start) + wrapped + form.description.slice(end);
    handleChange("description", newValue);
    setTimeout(() => textarea.focus(), 0);
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, 5 - images.length);
    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required.";
    if (!form.sku.trim()) newErrors.sku = "SKU is required.";
    if (!form.category) newErrors.category = "Category is required.";
    if (!form.sellerId) newErrors.sellerId = "Seller is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (!form.price || Number(form.price) <= 0) newErrors.price = "Enter a valid price.";
    if (form.stock === "" || Number(form.stock) < 0) newErrors.stock = "Enter a valid stock quantity.";
    if (form.lowStockThreshold === "" || Number(form.lowStockThreshold) < 0)
      newErrors.lowStockThreshold = "Enter a valid low stock threshold.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const imageUrl = images[0]?.file ? await uploadImage(images[0].file) : "";

      await api.post("/products", {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        seller_id: form.sellerId,
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        low_stock_threshold: Number(form.lowStockThreshold),
        status: form.status,
        product_type: form.productType,
        image_url: imageUrl,
        brand: form.brand.trim(),
        tags: tags.join(","),
        seller_consent: sellerConsent,
        weight: form.weight ? Number(form.weight) : null,
        dimensions: {
          length: form.length ? Number(form.length) : null,
          width: form.width ? Number(form.width) : null,
          height: form.height ? Number(form.height) : null,
        },
      });

      router.push("/products");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create product.";
      setSubmitError(message);
      if (err.response?.status === 409 && /sku/i.test(message)) {
        setErrors((e) => ({ ...e, sku: message }));
      }
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitError) {
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitError]);

  return (
    <div className="np-page">
      <Link href="/products" className="np-back-link">
        ← Back to Products
      </Link>
      <h1 className="np-title">Add New Product</h1>
      <p className="np-subtitle">Create a new product and add it to your marketplace.</p>

      {submitError && (
        <div className="np-submit-error" ref={errorBannerRef}>{submitError}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="np-grid">
          {/* Left column */}
          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">📋</span>
                <h3>Product Information</h3>
              </div>

              <div className="np-field-row">
                <div className="np-field">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                  {errors.name && <span className="np-error">{errors.name}</span>}
                </div>

                <div className="np-field">
                  <label>SKU *</label>
                  <div className="np-sku-row">
                    <input
                      type="text"
                      placeholder="Enter SKU"
                      value={form.sku}
                      onChange={(e) => handleChange("sku", e.target.value)}
                    />
                    <button
                      type="button"
                      className="np-sku-generate-btn"
                      onClick={() => handleChange("sku", generateSku())}
                    >
                      Generate
                    </button>
                  </div>
                  <span className="np-hint">Unique identifier for inventory — must not match any existing product</span>
                  {errors.sku && <span className="np-error">{errors.sku}</span>}
                </div>
              </div>

              <div className="np-field-row">
                <div className="np-field">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? "Loading categories..." : "Select Category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <span className="np-error">{errors.category}</span>}
                  {!loadingCategories && categories.length === 0 && (
                    <span className="np-hint">No categories available yet — ask an admin to add one.</span>
                  )}
                </div>  

                <div className="np-field">
                  <label>Seller *</label>
                  {isSeller ? (
                    <input
                      type="text"
                      value={currentUser?.store_name || currentUser?.full_name || "You"}
                      disabled
                      className="np-locked-input"
                    />
                  ) : (
                    <select
                      value={form.sellerId}
                      onChange={(e) => handleChange("sellerId", e.target.value)}
                      disabled={loadingSellers}
                    >
                      <option value="">{loadingSellers ? "Loading sellers..." : "Select Seller"}</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.store_name || s.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.sellerId && <span className="np-error">{errors.sellerId}</span>}
                </div>
              </div>

              <div className="np-field">
                <label>Description *</label>
                <div className="np-editor-toolbar">
                  <button type="button" onClick={() => applyFormat("bold")}><b>B</b></button>
                  <button type="button" onClick={() => applyFormat("italic")}><i>I</i></button>
                  <button type="button" onClick={() => applyFormat("underline")}><u>U</u></button>
                  <button type="button" onClick={() => applyFormat("ul")}>≡</button>
                  <button type="button" onClick={() => applyFormat("ol")}>☰</button>
                  <button type="button" onClick={() => applyFormat("link")}>🔗</button>
                </div>
                <textarea
                  ref={descRef}
                  rows={6}
                  placeholder="Enter product description..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
                {errors.description && <span className="np-error">{errors.description}</span>}
              </div>
            </div>

            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">🖼️</span>
                <h3>Product Images</h3>
              </div>
              <p className="np-images-hint">Upload product images. You can upload up to 5 images.</p>

              <div
                className={`np-dropzone ${dragActive ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <span className="np-dropzone-icon">☁️</span>
                <p>Drag & drop images here</p>
                <p className="np-dropzone-or">or</p>
                <label className="np-choose-files-btn">
                  Choose Files
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
                <p className="np-dropzone-note">JPG, PNG or WEBP (Max. 5MB each)</p>
              </div>

              {images.length > 0 && (
                <div className="np-image-previews">
                  {images.map((img, i) => (
                    <div key={i} className="np-image-preview">
                      <img src={img.previewUrl} alt={`Preview ${i + 1}`} />
                      <button type="button" onClick={() => removeImage(i)} aria-label="Remove image">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="np-col">
            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">💰</span>
                <h3>Pricing & Inventory</h3>
              </div>

              <div className="np-field">
                <label>Price *</label>
                <div className="np-input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                  />
                </div>
                {errors.price && <span className="np-error">{errors.price}</span>}
              </div>

              <div className="np-field-row">
                <div className="np-field">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter stock quantity"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                  />
                  {errors.stock && <span className="np-error">{errors.stock}</span>}
                </div>

                <div className="np-field">
                  <label>Low Stock Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter low stock alert"
                    value={form.lowStockThreshold}
                    onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                  />
                  {errors.lowStockThreshold && <span className="np-error">{errors.lowStockThreshold}</span>}
                </div>
              </div>
            </div>

            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">🟢</span>
                <h3>Product Status</h3>
              </div>
              <div className="np-field">
                <label>Status *</label>
                <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="np-hint">Inactive products will not be visible to customers</span>
              </div>

              <div className="np-field">
                <label>Product Type *</label>
                <select value={form.productType} onChange={(e) => handleProductTypeChange(e.target.value)}>
                  <option value="Regular">Regular Product</option>
                  <option value="Regional Famous">Regional Famous Product</option>
                </select>
                <span className="np-hint">Regional Famous Products are reviewed separately by the admin</span>
              </div>
            </div>  

            <div className="np-card">
              <div className="np-card-title">
                <span className="np-card-icon">📦</span>
                <h3>Additional Details</h3>
              </div>

              <div className="np-field">
                <label>Brand</label>
                <input
                  type="text"
                  placeholder="Enter brand name"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>

              <div className="np-field">
                <label>Tags</label>
                <div className="np-tags-input">
                  {tags.map((tag, i) => (
                    <span key={tag} className="np-tag-chip">
                      {tag}
                      <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}>✕</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "Type a tag and press Enter (e.g. Organic)" : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={() => tagInput.trim() && addTag(tagInput)}
                  />
                </div>
                <span className="np-hint">Press Enter or comma to add a tag — # is added automatically</span>
              </div>

              <div className="np-field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter weight"
                  value={form.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                />
              </div>

              <div className="np-field">
                <label>Dimensions (L x W x H) (cm)</label>
                <div className="np-dimensions-row">
                  <input
                    type="number"
                    min="0"
                    placeholder="Length"
                    value={form.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Width"
                    value={form.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Height"
                    value={form.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="np-card np-consent-card">
          <label className="np-consent-row">
            <input
              type="checkbox"
              checked={sellerConsent}
              onChange={(e) => setSellerConsent(e.target.checked)}
            />
            <span>
              I confirm that the seller can deliver this product within{" "}
              <strong>10 minutes</strong> to customers located within a{" "}
              <strong>3 km</strong> range. <span className="np-optional-tag">(Optional)</span>
            </span>
          </label>
        </div>

        <div className="np-actions">
          <Link href="/products" className="np-cancel-btn">Cancel</Link>
          <button type="submit" className="np-save-btn" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Product"}
          </button>
        </div>
      </form>

      {showRegionalConfirm && (
        <div className="np-confirm-overlay" onClick={cancelRegionalType}>
          <div className="np-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="np-confirm-icon">🏷️</div>
            <h3>Mark as Regional Famous Product?</h3>
            <p>Regional Famous Product means a region's specific famous product.</p>
            <div className="np-confirm-actions">
              <button type="button" className="np-confirm-cancel" onClick={cancelRegionalType}>
                Cancel
              </button>
              <button type="button" className="np-confirm-ok" onClick={confirmRegionalType}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}