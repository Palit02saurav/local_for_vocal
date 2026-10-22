import { FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "./social3d.css";

export default function Social3D() {
  return (
    <section className="social3d">
      <div className="social3d-heading">
        <div className="social3d-eyebrow">
          <span className="social3d-line" />
          <span className="social3d-eyebrow-text">Follow Us</span>
          <span className="social3d-line" />
        </div>
        <h2>Stay Connected With Us</h2>
      </div>
      <ul>
        <li>
          <a href="#">
            <FaFacebookF className="fa" aria-hidden="true" />
            <span> - Facebook</span>
          </a>
        </li>
        <li>
          <a href="#">
            <FaXTwitter className="fa" aria-hidden="true" />
            <span> - X</span>
          </a>
        </li>
        <li>
          <a href="#">
            <FaLinkedinIn className="fa" aria-hidden="true" />
            <span> - LinkedIn</span>
          </a>
        </li>
        <li>
          <a href="#">
            <FaInstagram className="fa" aria-hidden="true" />
            <span> - Instagram</span>
          </a>
        </li>
      </ul>
    </section>
  );
}