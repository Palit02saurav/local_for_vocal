"use client";

import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaPaperPlane,
  FaLock,
  FaLeaf,
  FaShieldAlt,
  FaUsers,
  FaHeadset,
  FaArrowRight,
} from "react-icons/fa";
import "./contact.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <main className="contact-page">
      {/* Hero */}
      <section className="contact-hero">
        <img
          className="contact-hero-bg"
          src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/628fe822fba2d82c5b2b8fa0d0d94df9.png"
          alt="Local artisans and plants"
        />
        <div className="contact-hero-overlay" />

        <div className="contact-hero-text">
          <span className="contact-eyebrow">Contact Us</span>
          <h1>
            We're Here to Help.
            <br />
            <span className="highlight">Let's Connect!</span>
          </h1>
          <p>
            Have a question, suggestion, or need support? Our team is
            ready to assist you.
          </p>
        </div>

        <div className="contact-hero-visual">
          <div className="floating-card card-1">
            <span className="floating-icon"><FaUsers /></span>
            <div>
              <h4>Support Local</h4>
              <p>Empowering local artisans and businesses</p>
            </div>
          </div>

          <div className="floating-card card-2">
            <span className="floating-icon"><FaLeaf /></span>
            <div>
              <h4>Sustainable Choices</h4>
              <p>Promoting eco-friendly and ethical products</p>
            </div>
          </div>

          <div className="floating-card card-3">
            <span className="floating-icon"><FaHeadset /></span>
            <div>
              <h4>Stronger Communities</h4>
              <p>Building a better future together</p>
            </div>
          </div>
        </div>
      </section>

      <div className="contact-content">
        {/* Left: Contact info */}
        <div className="contact-info-col">
          <h3 className="contact-col-heading">Get in Touch</h3>

          <div className="contact-info-item">
            <span className="contact-info-icon"><FaMapMarkerAlt /></span>
            <div>
              <p className="contact-info-title">Our Location</p>
              <p className="contact-info-text">
                123 Greenfield Road, Eco Park
                <br />
                Bangalore, Karnataka 560001, India
              </p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon"><FaPhoneAlt /></span>
            <div>
              <p className="contact-info-title">Call Us</p>
              <p className="contact-info-text">
                +91 98765 43210
                <br />
                Mon - Sat: 9:00 AM - 6:00 PM
              </p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon"><FaEnvelope /></span>
            <div>
              <p className="contact-info-title">Email Us</p>
              <p className="contact-info-text">
                info@geoinformaticx.com
                <br />
                support@geoinformaticx.com
              </p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon"><FaClock /></span>
            <div>
              <p className="contact-info-title">Business Hours</p>
              <p className="contact-info-text">
                Monday - Saturday: 9:00 AM - 6:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="contact-form-col">
          <h3 className="contact-col-heading">Send Us a Message</h3>

          {submitted && (
            <div className="contact-success-banner">
              ✓ Thank you! Your message has been sent successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-form-row">
              <label className="contact-label">
                Your Name
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </label>
              <label className="contact-label">
                Email Address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="contact-form-row">
              <label className="contact-label">
                Phone Number
                <input
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>
              <label className="contact-label">
                Subject
                <input
                  type="text"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="contact-label">
              Your Message
              <textarea
                placeholder="Tell us more..."
                rows={6}
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                required
              />
            </label>

            <button type="submit" className="contact-submit-btn">
              Send Message <FaPaperPlane />
            </button>

            <p className="contact-privacy-note">
              <FaLock /> We respect your privacy. Your information is safe with us.
            </p>
          </form>
        </div>
      </div>

      {/* Map */}
      <section className="contact-map-section">
        <div className="contact-map-card">
          <span className="contact-map-icon"><FaMapMarkerAlt /></span>
          <div>
            <h4>Find Us Here</h4>
            <p>We are conveniently located in Baghajatin, Kolkata.</p>
            <a href="#map" className="contact-map-link">
              View on Map <FaArrowRight />
            </a>
          </div>
        </div>

        <iframe
          title="Geoinformaticx location"
                    src="https://www.google.com/maps?q=Sagnik+Apartment,+3/81,+Raja+S.C.+Mullick+Road,+Kolkata-700032&z=19&output=embed"
          width="100%"
          height="360"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="contact-office-info">
          <h4>Visit Our Office</h4>
          <p>Sagnik Apartment, 3/81, Raja S.C. Mullick Road, Kolkata-700032</p>
          <p className="contact-office-landmark">Landmark: Beside Ekta Heights</p>
          
          <a  href="https://www.google.com/maps/dir/?api=1&destination=Sagnik+Apartment,+3/81,+Raja+S.C.+Mullick+Road,+Kolkata-700032"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-office-directions-btn"
          >
            Get Directions <FaArrowRight />
          </a>
        </div>
      </section>

      {/* Trust badges */}
      <section className="contact-trust-strip">
        <div className="trust-item">
          <span className="trust-icon"><FaLeaf /></span>
          <h4>Quick Response</h4>
          <p>We reply within 24 hours on business days.</p>
        </div>
        <div className="trust-item">
          <span className="trust-icon"><FaShieldAlt /></span>
          <h4>Trusted Support</h4>
          <p>Our team is dedicated to helping you.</p>
        </div>
        <div className="trust-item">
          <span className="trust-icon"><FaUsers /></span>
          <h4>Customer Focused</h4>
          <p>Your satisfaction is our top priority.</p>
        </div>
        <div className="trust-item">
          <span className="trust-icon"><FaHeadset /></span>
          <h4>Multiple Channels</h4>
          <p>Reach us via phone, email or visit us anytime.</p>
        </div>
      </section>
    </main>
  );
}