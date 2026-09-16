import Link from "next/link";
import {
  FaUsers,
  FaLeaf,
  FaHandshake,
  FaBullseye,
  FaEye,
  FaGem,
  FaCheckCircle,
  FaAward,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaShoppingBag,
  FaCog,
  FaSeedling,
  FaHandsHelping,
  FaStore,
  FaHeadset,
} from "react-icons/fa";
import "./about.css";

export default function About() {
  return (
    <div className="about-page">
      {/* Breadcrumb */}
      <div className="about-breadcrumb">
        <Link href="/">Home</Link>
        <span>&gt;</span>
        <span className="current">About Us</span>
      </div>

      {/* Hero */}
      <section className="about-hero">
        <img
          className="about-hero-bg"
          src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/628fe822fba2d82c5b2b8fa0d0d94df9.png"
          alt="Local artisan at work"
        />
        <div className="about-hero-overlay" />

        <div className="about-hero-text">
          <span className="about-eyebrow">About Geoinformaticx</span>
          <h1>
            Empowering Local.
            <br />
            <span className="highlight">Enriching Communities.</span>
          </h1>
          <p>
            Geoinformaticx is a local marketplace that connects you with
            unique products and trusted businesses from your community. We
            believe in supporting local artisans, farmers, entrepreneurs,
            and traditions that make our region special.
          </p>
          <button className="about-cta">Our Story</button>
        </div>

        <div className="about-hero-visual">
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
            <span className="floating-icon"><FaHandshake /></span>
            <div>
              <h4>Stronger Communities</h4>
              <p>Building a better future together</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="about-pillars">
        <div className="pillar">
          <span className="pillar-icon">
            <FaBullseye />
          </span>
          <h3>Our Mission</h3>
          <p>
            To create a sustainable ecosystem that empowers local
            businesses and makes unique, quality products accessible to
            everyone.
          </p>
        </div>

        <div className="pillar">
          <span className="pillar-icon">
            <FaEye />
          </span>
          <h3>Our Vision</h3>
          <p>
            A thriving local economy where communities grow together,
            traditions are preserved, and opportunities are limitless.
          </p>
        </div>

        <div className="pillar">
          <span className="pillar-icon">
            <FaGem />
          </span>
          <h3>Our Values</h3>
          <ul>
            <li>
              <FaCheckCircle /> Support local and small businesses
            </li>
            <li>
              <FaCheckCircle /> Promote authenticity and quality
            </li>
            <li>
              <FaCheckCircle /> Encourage sustainable living
            </li>
            <li>
              <FaCheckCircle /> Build trust and transparency
            </li>
          </ul>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="about-why">
        <h2>Why Choose Geoinformaticx?</h2>
        <div className="why-grid">
          <div className="why-item">
            <span className="why-icon">
              <FaAward />
            </span>
            <h4>Curated Quality</h4>
            <p>We handpick the best products and businesses from your region.</p>
          </div>
          <div className="why-item">
            <span className="why-icon">
              <FaShieldAlt />
            </span>
            <h4>Trusted &amp; Verified</h4>
            <p>All businesses are verified for your safety and trust.</p>
          </div>
          <div className="why-item">
            <span className="why-icon">
              <FaMapMarkerAlt />
            </span>
            <h4>Local &amp; Authentic</h4>
            <p>Discover products that reflect our local culture and heritage.</p>
          </div>
          <div className="why-item">
            <span className="why-icon">
              <FaCreditCard />
            </span>
            <h4>Secure Payments</h4>
            <p>Safe, secure and hassle-free payment options.</p>
          </div>
          <div className="why-item">
            <span className="why-icon">
              <FaTruck />
            </span>
            <h4>Fast &amp; Reliable</h4>
            <p>Quick delivery and real-time order tracking.</p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="about-stats">
        <div className="stat">
          <span className="stat-icon">
            <FaUsers />
          </span>
          <div>
            <h3>1,200+</h3>
            <p>Local Businesses</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <FaShoppingBag />
          </span>
          <div>
            <h3>15,000+</h3>
            <p>Unique Products</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <FaUsers />
          </span>
          <div>
            <h3>50,000+</h3>
            <p>Happy Customers</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <FaMapMarkerAlt />
          </span>
          <div>
            <h3>25+</h3>
            <p>Cities Covered</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <FaCog />
          </span>
          <div>
            <h3>99%</h3>
            <p>Positive Feedback</p>
          </div>
        </div>
      </section>

      {/* Bottom info strip */}
      <section className="about-footer-strip">
        <div className="strip-item">
          <span className="strip-icon">
            <FaSeedling />
          </span>
          <div>
            <h4>Supporting Sustainability</h4>
            <p>We promote eco-friendly products and responsible business practices.</p>
          </div>
        </div>
        <div className="strip-item">
          <span className="strip-icon">
            <FaHandsHelping />
          </span>
          <div>
            <h4>Join Our Community</h4>
            <p>Be a part of a growing community that values local and lives better.</p>
          </div>
        </div>
        <div className="strip-item">
          <span className="strip-icon">
            <FaStore />
          </span>
          <div>
            <h4>Partner With Us</h4>
            <p>Are you a local business? Join us and grow with Geoinformaticx.</p>
          </div>
        </div>
        <div className="strip-item">
          <span className="strip-icon">
            <FaHeadset />
          </span>
          <div>
            <h4>We're Here to Help</h4>
            <p>Our support team is always ready to assist you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}