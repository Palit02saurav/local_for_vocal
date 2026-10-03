"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { showToast } from "@/lib/toast";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaChevronRight,
  FaLeaf,
  FaShieldAlt,
  FaTruck,
  FaUsers,
  FaRegEnvelope,
  FaRegPaperPlane,
  FaHeart,
} from "react-icons/fa";
import "./footer.css";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/shop" },
  { label: "Local Businesses", href: "/map" },
  { label: "Offers", href: "/shop" },
  { label: "10-Min Fresh Delivery", href: "/business" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const HELP_LINKS = [
  { label: "Track Order", href: "/trackorder" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Return & Refund", href: "/return-refund" },
  { label: "FAQs", href: "/faqs" },
  { label: "Become a Seller", href: "/sell" },
  { label: "Customer Support", href: "/contact" },
];

const TRUST_ITEMS = [
  { icon: FaLeaf, lines: ["Local", "Products"] },
  { icon: FaShieldAlt, lines: ["Trusted", "Sellers"] },
  { icon: FaTruck, lines: ["Fast", "Delivery"] },
  { icon: FaUsers, lines: ["Support", "Local"] },
];

const BOTTOM_LINKS = ["Sitemap", "Accessibility", "Cookies", "Manage Preferences"];

const LinkColumn = ({ title, links }) => (
  <div className="footer-col">
    <h3>{title}</h3>
    <ul>
      {links.map((l) => (
        <li key={l.label}>
          <Link href={l.href}>
            <FaChevronRight className="footer-chevron" />
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;
    setSubscribing(true);
    try {
      await api.post("/contact/subscribe", { email: email.trim() });
      showToast("Thanks for subscribing! Check your inbox.", "success");
      setEmail("");
    } catch (err) {
      showToast(err.message || "Could not subscribe. Please try again.", "error");
    } finally {
      setSubscribing(false);
    }
  };
  return (
    <footer className="footer">
      <div className="footer-glow footer-glow-left" />
      <div className="footer-glow footer-glow-right" />

      <div className="footer-container">
        {/* Brand */}
        <div className="footer-col footer-brand">
          <div className="footer-logo">
            <Image
              src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png"
              alt="Geoinformaticx"
              width={52}
              height={52}
              unoptimized
            />
            <div>
              <h2>
                Geoin<span className="footer-logo-accent">forma</span>ticx
              </h2>
              <p className="footer-tagline">Discover. Support. Grow Local.</p>
            </div>
          </div>

          <p className="footer-description">
            Empowering local artisans and businesses by connecting them with
            customers who value local and authentic products.
          </p>

          <div className="footer-socials">
            <Link href="#" aria-label="Facebook">
              <FaFacebookF />
            </Link>
            <Link href="#" aria-label="Instagram">
              <FaInstagram />
            </Link>
            <Link href="#" aria-label="YouTube">
              <FaYoutube />
            </Link>
            <Link href="#" aria-label="WhatsApp">
              <FaWhatsapp />
            </Link>
          </div>

          <div className="footer-trust">
            {TRUST_ITEMS.map(({ icon: Icon, lines }) => (
              <div key={lines.join(" ")} className="footer-trust-item">
                <Icon className="footer-trust-icon" />
                <span>
                  {lines[0]}
                  <br />
                  {lines[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <LinkColumn title="Quick Links" links={QUICK_LINKS} />
        <LinkColumn title="Company" links={COMPANY_LINKS} />
        <LinkColumn title="Help & Support" links={HELP_LINKS} />

        {/* Newsletter */}
        <div className="footer-newsletter">
          <FaRegPaperPlane className="newsletter-plane" />

          <div className="newsletter-head">
            <span className="newsletter-icon">
              <FaRegEnvelope />
            </span>
            <h3>Subscribe to our Newsletter</h3>
          </div>

          <p>
            Get the latest updates on new products, offers, and local
            businesses.
          </p>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <FaRegEnvelope className="newsletter-input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={subscribing}>
              {subscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          <div className="footer-payments">
            <h4>We Accept</h4>
            <div className="payment-icons">
              {[
                { src: "/images/visa.png", alt: "Visa" },
                { src: "/images/matercard.png", alt: "Mastercard" },
                { src: "/images/upi.png", alt: "UPI" },
                { src: "/images/paytm.png", alt: "Paytm" },
                { src: "/images/rupay.png", alt: "RuPay" },
              ].map((p) => (
                <span key={p.alt} className="payment-badge">
                  <Image src={p.src} alt={p.alt} width={44} height={24} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Geoinformaticx. All Rights Reserved.
        </p>

        <div className="footer-bottom-links">
          {BOTTOM_LINKS.map((label) => (
            <Link key={label} href="#">
              {label}
            </Link>
          ))}
        </div>

        <p className="footer-credit">
          Made with <FaHeart className="footer-heart" /> for local communities
        </p>
      </div>

      {/* Decorative wave */}
      <svg
        className="footer-wave"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="waveGreen" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#1f6b45" />
            <stop offset="55%" stopColor="#3f9a69" />
            <stop offset="100%" stopColor="#2b7c53" />
          </linearGradient>
        </defs>
        <path
          d="M0,38 C280,78 560,6 860,36 S1320,64 1440,26 L1440,80 L0,80 Z"
          fill="url(#waveGreen)"
        />
        <path
          d="M0,52 C280,92 560,20 860,50 S1320,78 1440,40 L1440,80 L0,80 Z"
          fill="#f4f7f5"
        />
      </svg>
    </footer>
  );
};

export default Footer;