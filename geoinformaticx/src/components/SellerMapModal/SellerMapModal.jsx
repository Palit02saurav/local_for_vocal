"use client";

import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import "./SellerMapModal.css";

// Seller initials shown inside the avatar circle until real profile
// pictures exist for sellers.
function initialsFor(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ProductRow({ p }) {
  const router = useRouter();
  const isService = p.type === "Services";
  const detailPath = isService ? `/services/${p.sku}` : `/shop/${p.sku}`;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ productId: p.id, type: isService ? "service" : "product" });
  };

  return (
    <div
      className="seller-map-modal-product-card"
      onClick={() => p.sku && router.push(detailPath)}
    >
      <img src={p.img} alt={p.name} />
      <div className="seller-map-modal-product-info">
        <div className="seller-map-modal-product-name">{p.name}</div>
        <div className="seller-map-modal-product-category">{p.category}</div>
        <div className="seller-map-modal-product-actions">
          <button
            className="seller-map-modal-btn seller-map-modal-btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              if (p.sku) router.push(detailPath);
            }}
          >
            View Details
          </button>
          {!isService && (
            <button
              className="seller-map-modal-btn seller-map-modal-btn-solid"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerMapModal({ seller, onClose }) {
  if (!seller) return null;

  return (
    <div className="seller-map-modal-overlay" onClick={onClose}>
      <div className="seller-map-modal" onClick={(e) => e.stopPropagation()}>
        <button className="seller-map-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="seller-map-modal-header">
          {seller.img ? (
            <img src={seller.img} alt={seller.name} className="seller-map-modal-avatar" />
          ) : (
            <div className="seller-map-modal-avatar seller-map-modal-avatar-placeholder">
              {initialsFor(seller.name)}
            </div>
          )}

          <h3>{seller.name}</h3>

          <div className="seller-map-modal-meta">
            <p className="seller-map-modal-meta-row">📍 {seller.location || "Location not set"}</p>
            {seller.phone && <p className="seller-map-modal-meta-row">📞 {seller.phone}</p>}
            <p className="seller-map-modal-meta-row seller-map-modal-meta-placeholder">
              🕒 Hours not listed yet
            </p>
            <p className="seller-map-modal-meta-row seller-map-modal-meta-placeholder">
              ⭐ No ratings yet
            </p>
          </div>
        </div>

        <div className="seller-map-modal-body">
          <h4>Regional Famous Products</h4>
          {seller.regionalProducts.length === 0 ? (
            <p className="seller-map-modal-empty">No Regional Famous products from this seller yet.</p>
          ) : (
            <div className="seller-map-modal-products">
              {seller.regionalProducts.map((p, i) => (
                <ProductRow p={p} key={`regional-${i}`} />
              ))}
            </div>
          )}
        </div>

        <div className="seller-map-modal-body seller-map-modal-body-secondary">
          <h4>More from this seller</h4>
          {seller.otherProducts.length === 0 ? (
            <p className="seller-map-modal-empty">No other listings from this seller yet.</p>
          ) : (
            <div className="seller-map-modal-products">
              {seller.otherProducts.map((p, i) => (
                <ProductRow p={p} key={`other-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}