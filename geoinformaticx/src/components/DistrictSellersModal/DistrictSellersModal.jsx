"use client";

import "./DistrictSellersModal.css";

export default function DistrictSellersModal({ districtName, sellers, onViewStore, onClose }) {
  if (!districtName) return null;

  return (
    <div className="district-sellers-modal-overlay" onClick={onClose}>
      <div className="district-sellers-modal" onClick={(e) => e.stopPropagation()}>
        <button className="district-sellers-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="district-sellers-modal-header">
          <h3>{districtName}</h3>
          <p className="district-sellers-modal-subtitle">
            {sellers.length} seller{sellers.length === 1 ? "" : "s"} in this district
          </p>
        </div>

        <div className="district-sellers-modal-body">
          {sellers.length === 0 ? (
            <p className="district-sellers-modal-empty">No sellers found in this district yet.</p>
          ) : (
            sellers.map((s) => (
              <div className="district-sellers-modal-card" key={s.id}>
                <div className="district-sellers-modal-name">{s.store_name || s.full_name}</div>
                <div className="district-sellers-modal-location">📍 {s.location || "Location not set"}</div>
                <div className="district-sellers-modal-rating">⭐ No ratings yet</div>
                <button
                  className="district-sellers-modal-view-btn"
                  onClick={() => onViewStore(s.id)}
                >
                  View Store
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}