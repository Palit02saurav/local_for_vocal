import Link from "next/link";
import {
  FaShieldAlt,
  FaUserLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHeadset,
  FaFileContract,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import "./help.css";

export default function Help() {
  return (
    <main className="help-page">
      <div className="help-header">
        <Link href="/" className="help-back-link">
          <FaArrowLeft /> Back to Dashboard
        </Link>
        <span className="help-updated">Last updated: September 2026</span>
      </div>

      <div className="help-hero">
        <span className="help-hero-icon">
          <FaFileContract />
        </span>
        <div>
          <h1>Admin Panel Usage Policy</h1>
          <p>
            This policy outlines how the Geoinformaticx Admin Panel should be
            used, the responsibilities of admins and sellers, and how
            marketplace data is handled.
          </p>
        </div>
      </div>

      <div className="help-grid">
        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaShieldAlt />
            </span>
            <h2>1. Purpose &amp; Scope</h2>
          </div>
          <p>
            The Admin Panel is a restricted internal tool used to manage
            sellers, products, services, orders, categories, and platform
            content for the Geoinformaticx marketplace. Access is limited to
            authorized personnel only — Super Admins and approved Sellers —
            and every action performed here should be for legitimate
            business purposes.
          </p>
        </section>

        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaUserLock />
            </span>
            <h2>2. Account Security</h2>
          </div>
          <ul>
            <li>Never share your admin login credentials with anyone.</li>
            <li>Log out of the panel when using a shared or public device.</li>
            <li>
              Report any suspicious activity on your account to the support
              team immediately.
            </li>
            <li>
              Passwords should be changed periodically and never reused
              across other platforms.
            </li>
          </ul>
        </section>

        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaCheckCircle />
            </span>
            <h2>3. Approvals &amp; Review Guidelines</h2>
          </div>
          <p>
            Super Admins are responsible for reviewing all seller signups,
            product listings, service listings, and banner submissions before
            they go live. When reviewing a request:
          </p>
          <ul>
            <li>
              Verify seller business details (GST, registration, and PAN
              numbers) are complete and consistent.
            </li>
            <li>
              Check product and service listings for accurate pricing,
              descriptions, and appropriate images.
            </li>
            <li>
              Reject listings that violate marketplace guidelines or contain
              misleading information, with a clear reason where possible.
            </li>
            <li>
              Approvals and rejections are logged and cannot be reversed
              silently — always double-check before confirming a decision.
            </li>
          </ul>
        </section>

        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaShieldAlt />
            </span>
            <h2>4. Data Confidentiality</h2>
          </div>
          <p>
            Customer, seller, and order data accessible through this panel is
            confidential. This includes contact details, addresses, payment
            references, and business documents. This data must:
          </p>
          <ul>
            <li>Only be used for platform administration purposes.</li>
            <li>
              Never be exported, screenshotted, or shared outside the
              organization without authorization.
            </li>
            <li>
              Be handled in line with applicable data protection
              regulations.
            </li>
          </ul>
        </section>

        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaExclamationTriangle />
            </span>
            <h2>5. Acceptable Use</h2>
          </div>
          <p>The Admin Panel must not be used to:</p>
          <ul>
            <li>Approve your own or a related party's seller/product listings without proper review.</li>
            <li>Alter order or payment records outside of standard support workflows.</li>
            <li>Access accounts or data unrelated to your assigned responsibilities.</li>
            <li>Bypass approval workflows for personal or business gain.</li>
          </ul>
          <p>
            Violations of this policy may result in access being revoked and
            further action as per company policy.
          </p>
        </section>

        <section className="help-section">
          <div className="help-section-title">
            <span className="help-icon">
              <FaClock />
            </span>
            <h2>6. Data Retention</h2>
          </div>
          <p>
            Order history, seller records, and approval logs are retained for
            as long as necessary to support business, legal, and audit
            requirements. Rejected or removed listings may be retained in an
            archived state rather than permanently deleted, for record-keeping
            purposes.
          </p>
        </section>

        <section className="help-section help-section-full">
          <div className="help-section-title">
            <span className="help-icon">
              <FaHeadset />
            </span>
            <h2>7. Need Help?</h2>
          </div>
          <p>
            If you're unsure whether an action complies with this policy, or
            you've noticed something that needs attention, reach out before
            proceeding.
          </p>
          <div className="help-contact-row">
            <a href="mailto:support@geoinformaticx.com" className="help-contact-item">
              support@geoinformaticx.com
            </a>
            <a href="tel:+919876543210" className="help-contact-item">
              +91 98765 43210
            </a>
          </div>
        </section>
      </div>

      <p className="help-footer-note">
        This policy may be updated periodically. Continued use of the Admin
        Panel constitutes acceptance of the current version of this policy.
      </p>
    </main>
  );
}