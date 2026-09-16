"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaRupeeSign,
  FaChartLine,
  FaHeadset,
  FaBoxOpen,
  FaShippingFast,
  FaRocket,
  FaUserPlus,
  FaStore,
  FaBullhorn,
  FaGlobe,
  FaShieldAlt,
  FaLaptop,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import "./sell.css";

const BUSINESS_CATEGORIES = [
  "Handicrafts & Pottery",
  "Food & Groceries",
  "Fashion & Apparel",
  "Home & Decor",
  "Electronics",
  "Services",
  "Other",
];

export default function Sell() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    category: "",
    city: "",
    agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.agreed) return;
    setSubmitting(true);
    try {
      // TODO: wire this up to your API route, e.g. POST /api/sellers
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sell-page">
      {/* Breadcrumb */}
      <div className="sell-breadcrumb">
        <Link href="/">Home</Link>
        <span>&gt;</span>
        <span className="current">Sell With Us</span>
      </div>

      {/* Hero */}
      <section className="sell-hero">
        <div className="sell-hero-text">
          <h1>
            Sell With <span className="highlight">Geoinformaticx</span>
          </h1>
          <p className="sell-subheading">
            Grow your business. Reach more customers. Sell more.
          </p>
          <p className="sell-description">
            Join our local marketplace and be a part of a trusted platform
            that supports local businesses and brings your products to
            thousands of happy customers.
          </p>

          <div className="sell-perks">
            <div className="perk">
              <span className="perk-icon">
                <FaRupeeSign />
              </span>
              <div>
                <h4>Zero Join Fee</h4>
                <p>No hidden charges</p>
              </div>
            </div>
            <div className="perk">
              <span className="perk-icon">
                <FaChartLine />
              </span>
              <div>
                <h4>Grow Your Business</h4>
                <p>Reach more local buyers</p>
              </div>
            </div>
            <div className="perk">
              <span className="perk-icon">
                <FaHeadset />
              </span>
              <div>
                <h4>Dedicated Support</h4>
                <p>We're here to help you</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sell-hero-visual">
          <div className="sell-hero-image">
            <img src="/images/sell-hero.png" alt="Local seller preparing products" />
          </div>

          <div className="floating-card card-1">
            <span className="floating-icon">
              <FaBoxOpen />
            </span>
            <div>
              <h4>List Your Products</h4>
              <p>Add unlimited products and manage easily</p>
            </div>
          </div>

          <div className="floating-card card-2">
            <span className="floating-icon">
              <FaShippingFast />
            </span>
            <div>
              <h4>Get More Orders</h4>
              <p>Connect with thousands of local customers</p>
            </div>
          </div>

          <div className="floating-card card-3">
            <span className="floating-icon">
              <FaRocket />
            </span>
            <div>
              <h4>Grow With Us</h4>
              <p>Increase sales and take your brand forward</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content grid: left = how it works + why sell, right = form */}
      <div className="sell-main-grid">
        <div className="sell-main-left">
          {/* How It Works */}
          <section className="how-it-works">
            <h2>
              <span className="line" /> How It Works <span className="line" />
            </h2>
            <p className="section-subtitle">
              Start selling in just a few simple steps
            </p>

            <div className="steps-row">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-icon">
                  <FaUserPlus />
                </span>
                <h4>Register</h4>
                <p>Create your seller account in minutes.</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-icon">
                  <FaStore />
                </span>
                <h4>Set Up Your Shop</h4>
                <p>Add your business details, logo, and shop info.</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-icon">
                  <FaBoxOpen />
                </span>
                <h4>Add Products</h4>
                <p>List your products with photos, prices &amp; details.</p>
              </div>
              <div className="step">
                <span className="step-number">4</span>
                <span className="step-icon">
                  <FaBullhorn />
                </span>
                <h4>Start Selling</h4>
                <p>Your shop goes live and customers start ordering.</p>
              </div>
              <div className="step">
                <span className="step-number">5</span>
                <span className="step-icon">
                  <FaChartLine />
                </span>
                <h4>Grow &amp; Earn</h4>
                <p>Manage orders, grow your sales and earnings.</p>
              </div>
            </div>
          </section>

          {/* Why Sell */}
          <section className="why-sell">
            <h2>Why Sell With Geoinformaticx?</h2>
            <div className="why-sell-grid">
              <div className="why-sell-item">
                <span className="why-sell-icon">
                  <FaGlobe />
                </span>
                <h4>Wide Reach</h4>
                <p>Get access to a large base of local buyers.</p>
              </div>
              <div className="why-sell-item">
                <span className="why-sell-icon">
                  <FaShieldAlt />
                </span>
                <h4>Secure Payments</h4>
                <p>Receive payments safely and on time.</p>
              </div>
              <div className="why-sell-item">
                <span className="why-sell-icon">
                  <FaLaptop />
                </span>
                <h4>Easy to Use</h4>
                <p>Simple tools to manage products and orders.</p>
              </div>
              <div className="why-sell-item">
                <span className="why-sell-icon">
                  <FaBullhorn />
                </span>
                <h4>Marketing Support</h4>
                <p>We promote your products through offers and campaigns.</p>
              </div>
              <div className="why-sell-item">
                <span className="why-sell-icon">
                  <FaMapMarkerAlt />
                </span>
                <h4>Local Impact</h4>
                <p>Be a part of a platform that supports local growth.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Become a Seller form */}
        <aside className="sell-form-card">
          <h2>Become a Seller</h2>
          <p className="form-subtitle">Fill the form below to get started</p>

          {submitted ? (
            <div className="form-success">
              <h4>Application received!</h4>
              <p>
                Thanks for applying, {form.fullName || "there"}. Our team will
                reach out to you shortly to complete your seller setup.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="seller-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="fullName">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="businessName">
                    Business Name <span className="required">*</span>
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="Enter your business name"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="category">
                    Business Category <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="city">
                    City / Location <span className="required">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Enter your city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="agreed"
                  checked={form.agreed}
                  onChange={handleChange}
                  required
                />
                <span>
                  I agree to the <Link href="/terms">Terms &amp; Conditions</Link>{" "}
                  and <Link href="/seller-policy">Seller Policy</Link>
                </span>
              </label>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>

              <p className="login-link">
                Already have an account? <Link href="/login">Login</Link>
              </p>
            </form>
          )}
        </aside>
      </div>

      {/* Need Help bar */}
      <section className="need-help">
        <div className="need-help-left">
          <span className="need-help-icon">
            <FaHeadset />
          </span>
          <div>
            <h4>Need Help?</h4>
            <p>Our seller support team is always ready to assist you.</p>
          </div>
        </div>
        <div className="need-help-right">
          <a href="mailto:sellersupport@geoinformaticx.com">
            <FaEnvelope /> sellersupport@geoinformaticx.com
          </a>
          <a href="tel:+919876543210">
            <FaPhoneAlt /> +91 98765 43210
          </a>
        </div>
      </section>
    </div>
  );
}