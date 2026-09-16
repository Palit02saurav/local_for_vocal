"use client";

import Link from "next/link";
import { getRelatedBusinesses } from "@/lib/businesses";
import "./business.css";

export default function BusinessDetail({ business }) {
  const relatedBusinesses = getRelatedBusinesses(business.slug, 3);

  return (
    <main className="bd-page">
      <div className="bd-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>
        <Link href="/business">Local Businesses</Link> <span>›</span>
        <span>{business.name}</span>
      </div>

      <div className="bd-hero">
        <img src={business.img} alt={business.name} className="bd-hero-img" />
      </div>

      <div className="bd-top">
        <div>
          <h1 className="bd-name">
            {business.name}
            {business.verified && <span className="bd-verified">✓ Verified</span>}
          </h1>
          <p className="bd-category">{business.category}</p>
          <div className="bd-meta-row">
            <span>⭐ {business.rating} ({business.reviews} reviews)</span>
            <span>📍 {business.distance}</span>
          </div>
        </div>
        <a href={`tel:${business.phone}`} className="bd-call-btn">📞 Call Business</a>
      </div>

      <div className="bd-columns">
        <div className="bd-column">
          <h3>About</h3>
          <p className="bd-about">{business.description}</p>
        </div>
        <div className="bd-column">
          <h3>Contact Info</h3>
          <p className="bd-info-row">📍 {business.address}</p>
          <p className="bd-info-row">📞 {business.phone}</p>
          <p className="bd-info-row">🕒 {business.hours}</p>
        </div>
      </div>

      {relatedBusinesses.length > 0 && (
        <div className="bd-related-section">
          <h3>Other Local Businesses</h3>
          <div className="bd-related-grid">
            {relatedBusinesses.map((b) => (
              <Link key={b.slug} href={`/business/${b.slug}`} className="bd-related-card">
                <img src={b.img} alt={b.name} className="bd-related-img" />
                <p className="bd-related-name">{b.name}</p>
                <p className="bd-related-category">{b.category}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}