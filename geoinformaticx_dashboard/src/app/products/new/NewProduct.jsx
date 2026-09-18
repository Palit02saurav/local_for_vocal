"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import "./new-product.css";

const EMPTY_FORM = {
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
};

let draftCounter = 0;
const makeDraft = (overrides = {}) => ({
  key: `draft-${++draftCounter}`,
  form: { ...EMPTY_FORM, ...overrides },
  tags: [],
  images: [],
  sellerConsent: false,
});

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const COMPRESSION_QUALITY = 0.7; // re-encode at 70% quality = 30% reduction

// Re-encode in the browser before upload. PNGs go to WebP so transparency
// survives; everything else goes to JPEG.
async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const outType = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, outType, COMPRESSION_QUALITY)
    );

    // If the re-encode came out bigger (already-optimised source), keep the original.
    if (!blob || blob.size >= file.size) return file;

    const ext = outType === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error("Image compression failed, uploading original:", err);
    return file;
  }
}

const formatKb = (bytes) => `${Math.round(bytes / 1024)} KB`;
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

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [sellerConsent, setSellerConsent] = useState(false);

  const [images, setImages] = useState([]); // { file, previewUrl }

  const [drafts, setDrafts] = useState(() => [makeDraft()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);
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

  // Fold the live fields back into the drafts array before we switch away.
  const captureActive = (list = drafts) =>
    list.map((d, i) =>
      i === activeIndex ? { ...d, form, tags, images, sellerConsent } : d
    );

  const loadDraft = (draft) => {
    setForm(draft.form);
    setTags(draft.tags);
    setImages(draft.images);
    setSellerConsent(draft.sellerConsent);
    setErrors({});
    setTagInput("");
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
    // carry the seller over so admins don't re-pick it for every product
    const fresh = makeDraft({ sellerId: form.sellerId });
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
      ...makeDraft(),
      form: { ...source.form, name: "", sku: "" }, // name + SKU must stay unique
      tags: [...source.tags],
      images: [...source.images],
      sellerConsent: source.sellerConsent,
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
      idx === activeIndex
        ? Math.max(0, idx - 1)
        : idx < activeIndex
        ? activeIndex - 1
        : activeIndex;
    setDrafts(next);
    setActiveIndex(nextActive);
    loadDraft(next[nextActive]);
    setSubmitError("");
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
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;

    setCompressing(true);
    try {
      const newImages = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file);
          return {
            file: compressed,
            previewUrl: URL.createObjectURL(compressed),
            originalSize: file.size,
            size: compressed.size,
          };
        })
      );
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
      setErrors((e) => ({ ...e, images: "" }));
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx]?.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };  

  const validateForm = (f, draftImages = []) => {
    const newErrors = {};
    if (draftImages.length < MIN_IMAGES)
      newErrors.images = `Add at least ${MIN_IMAGES} images (${draftImages.length} added so far).`;
    if (!f.name.trim()) newErrors.name = "Product name is required.";
    if (!f.sku.trim()) newErrors.sku = "SKU is required.";
    if (!f.category) newErrors.category = "Category is required.";
    if (!f.sellerId) newErrors.sellerId = "Seller is required.";
    if (!f.description.trim()) newErrors.description = "Description is required.";
    if (!f.price || Number(f.price) <= 0) newErrors.price = "Enter a valid price.";
    if (f.stock === "" || Number(f.stock) < 0) newErrors.stock = "Enter a valid stock quantity.";
    if (f.lowStockThreshold === "" || Number(f.lowStockThreshold) < 0)
      newErrors.lowStockThreshold = "Enter a valid low stock threshold.";
    return newErrors;
  };
  const buildPayload = (draft, imageUrls) => ({
    name: draft.form.name.trim(),
    sku: draft.form.sku.trim(),
    category: draft.form.category,
    seller_id: draft.form.sellerId,
    description: draft.form.description.trim(),
    price: Number(draft.form.price),
    stock: Number(draft.form.stock),
    low_stock_threshold: Number(draft.form.lowStockThreshold),
    status: draft.form.status,
    product_type: draft.form.productType,
    image_url: imageUrls[0] || "",       // main/cover image
    gallery_urls: imageUrls.join(","),   // every uploaded image
    brand: draft.form.brand.trim(),
    tags: draft.tags.join(","),
    seller_consent: draft.sellerConsent,
    weight: draft.form.weight ? Number(draft.form.weight) : null,
    dimensions: {
      length: draft.form.length ? Number(draft.form.length) : null,
      width: draft.form.width ? Number(draft.form.width) : null,
      height: draft.form.height ? Number(draft.form.height) : null,
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const all = captureActive();
    setDrafts(all);

    // 1. Validate every product; jump to the first broken one.
    for (let i = 0; i < all.length; i++) {
      const errs = validateForm(all[i].form, all[i].images);
      if (Object.keys(errs).length > 0) {
        setActiveIndex(i);
        loadDraft(all[i]);
        setErrors(errs);
        setSubmitError(
          all.length === 1
            ? "Please fix the highlighted fields."
            : `Product ${i + 1} has missing or invalid fields.`
        );
        return;
      }
    }

    // 2. SKUs must be unique inside this batch too, not just in the DB.
    const skus = all.map((d) => d.form.sku.trim().toLowerCase());
    const dupAt = skus.findIndex((s, i) => skus.indexOf(s) !== i);
    if (dupAt > -1) {
      setActiveIndex(dupAt);
      loadDraft(all[dupAt]);
      setErrors({ sku: "This SKU is already used by another product in this batch." });
      setSubmitError(`Product ${dupAt + 1} reuses a SKU from another product above.`);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    // 3. Post one by one — the API has no bulk endpoint.
    const failures = [];
    for (let i = 0; i < all.length; i++) {
      const draft = all[i];
      try {
        const imageUrls = await Promise.all(
          draft.images.filter((img) => img.file).map((img) => uploadImage(img.file))
        );
        await api.post("/products", buildPayload(draft, imageUrls));
      } catch (err) {
        failures.push({
          index: i,
          draft,
          message: err.response?.data?.message || "Failed to create product.",
        });
      }
    }

    if (failures.length === 0) {
      router.push("/products");
      return;
    }

    const saved = all.length - failures.length;
    const remaining = failures.map((f) => f.draft);
    setDrafts(remaining);
    setActiveIndex(0);
    loadDraft(remaining[0]);
    setErrors(
      /sku/i.test(failures[0].message) ? { sku: failures[0].message } : {}
    );
    setSubmitError(
      `${saved} of ${all.length} products saved. Still to fix: ` +
        failures.map((f) => `Product ${f.index + 1} — ${f.message}`).join(" | ")
    );
    setSubmitting(false);
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
      <p className="np-subtitle">
        Create one or more products and add them to your marketplace.
      </p>

      <div className="np-drafts-bar">
        <div className="np-draft-tabs">
          {drafts.map((d, i) => {
            const label =
              (i === activeIndex ? form.name : d.form.name)?.trim() ||
              `Product ${i + 1}`;
            return (
              <div
                key={d.key}
                className={`np-draft-tab ${i === activeIndex ? "active" : ""}`}
              >
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
            + Add another product
          </button>
          <button type="button" className="np-draft-dup" onClick={duplicateDraft}>
            ⧉ Duplicate this one
          </button>
        </div>
      </div>

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
              <p className="np-images-hint">
                Upload at least {MIN_IMAGES} images (up to {MAX_IMAGES}). Images are
                compressed automatically before upload.
              </p>

              <div className="np-image-counter">
                <div className="np-image-counter-track">
                  <div
                    className="np-image-counter-fill"
                    style={{
                      width: `${Math.min(100, (images.length / MIN_IMAGES) * 100)}%`,
                    }}
                  />
                </div>
                <span
                  className={images.length >= MIN_IMAGES ? "np-count-ok" : "np-count-short"}
                >
                  {images.length >= MIN_IMAGES
                    ? `${images.length} of ${MAX_IMAGES} added ✓`
                    : `${images.length} of ${MIN_IMAGES} required`}
                </span>
              </div>

              <div
                className={`np-dropzone ${dragActive ? "active" : ""} ${
                  images.length >= MAX_IMAGES ? "full" : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <span className="np-dropzone-icon">☁️</span>
                {compressing ? (
                  <p>Compressing images...</p>
                ) : images.length >= MAX_IMAGES ? (
                  <p>Maximum {MAX_IMAGES} images reached</p>
                ) : (
                  <>
                    <p>Drag & drop images here</p>
                    <p className="np-dropzone-or">or</p>
                    <label className="np-choose-files-btn">
                      Choose Files
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        hidden
                        disabled={compressing}
                        onChange={(e) => {
                          handleFiles(e.target.files);
                          e.target.value = ""; // allow re-picking the same file
                        }}
                      />
                    </label>
                  </>
                )}
                <p className="np-dropzone-note">JPG, PNG or WEBP (Max. 5MB each)</p>
              </div>

              {errors.images && <span className="np-error">{errors.images}</span>}

              {images.length > 0 && (
                <div className="np-image-previews">
                  {images.map((img, i) => (
                    <div key={img.previewUrl} className="np-image-preview">
                      <img src={img.previewUrl} alt={`Preview ${i + 1}`} />
                      <button type="button" onClick={() => removeImage(i)} aria-label="Remove image">✕</button>
                      {i === 0 && <span className="np-image-main-badge">Main</span>}
                      {img.originalSize > img.size && (
                        <span className="np-image-size">
                          {formatKb(img.originalSize)} → {formatKb(img.size)}
                        </span>
                      )}
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
            {submitting
              ? `Saving ${drafts.length} product${drafts.length > 1 ? "s" : ""}...`
              : `💾 Save ${drafts.length > 1 ? `${drafts.length} Products` : "Product"}`}
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