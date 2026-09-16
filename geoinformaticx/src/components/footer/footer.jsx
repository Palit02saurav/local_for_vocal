"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import "./footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    // TODO: hook up newsletter subscription API
    console.log("Subscribing email:", email);
    setEmail("");
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-col footer-brand">
          <div className="footer-logo">
            <Image
              src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png"
              alt="Geoinformaticx"
              width={36}
              height={36}
              unoptimized
            />
            <div>
              <h2>Geoinformaticx</h2>
              <p className="footer-tagline">
                Discover. Support. Grow Local.
              </p>
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
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/shop">Shop</Link>
            </li>
            <li>
              <Link href="/categories">Categories</Link>
            </li>
            <li>
              <Link href="/local-businesses">Local Businesses</Link>
            </li>
            <li>
              <Link href="/offers">Offers</Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h3>Company</h3>
          <ul>
            <li>
              <Link href="/about-us">About Us</Link>
            </li>
            <li>
              <Link href="/contact-us">Contact Us</Link>
            </li>
            <li>
              <Link href="/terms-conditions">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund-policy">Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div className="footer-col">
          <h3>Help</h3>
          <ul>
            <li>
              <Link href="/track-order">Track Order</Link>
            </li>
            <li>
              <Link href="/shipping-policy">Shipping Policy</Link>
            </li>
            <li>
              <Link href="/return-refund">Return & Refund</Link>
            </li>
            <li>
              <Link href="/faqs">FAQs</Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-col footer-newsletter">
          <h3>Subscribe to our Newsletter</h3>
          <p>
            Get the latest updates on new products, offers, and local
            businesses.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>

          <div className="footer-payments">
            <h4>We Accept</h4>
            <div className="payment-icons">
              <Image src="/images/visa.png" alt="Visa" width={40} height={26} />
              <Image
                src="/images/matercard.png"
                alt="Mastercard"
                width={40}
                height={26}
              />
              <Image src="/images/upi.png" alt="UPI" width={40} height={26} />
              <Image
                src="/images/paytm.png"
                alt="Paytm"
                width={40}
                height={26}
              />
              <Image
                src="/images/rupay.png"
                alt="RuPay"
                width={40}
                height={26}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Geoinformaticx. All Rights Reserved.</p>
        <p className="footer-credit">Made with ❤️ for local communities</p>
      </div>
    </footer>
  );
};

export default Footer;