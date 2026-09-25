"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";
import "./login.css";

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "vendor"
  const router = useRouter();

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    businessName: "",
    fullName: "",
    email: "",
    phone: "",
    location: "",
    latitude: null,
    longitude: null,
    sellerType: "",
    gstNumber: "",
    businessRegNumber: "",
    panNumber: "",
  });

    const [vendorForm, setVendorForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    latitude: null,
    longitude: null,
    idType: "aadhaar", // "aadhaar" | "pan"
    idNumber: "",
  });
  const [vendorError, setVendorError] = useState("");
  const [vendorSuccess, setVendorSuccess] = useState("");
  const [vendorLocating, setVendorLocating] = useState(false);
  const [vendorLocationError, setVendorLocationError] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location is not supported on this device/browser.");
      return;
    }

    setLocationError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                // Nominatim's usage policy requires identifying the app — no API key needed.
                "Accept-Language": "en",
              },
            }
          );
          const data = await res.json();

          if (!data || data.error) {
            throw new Error("Could not resolve address for this location.");
          }

          const addr = data.address || {};
          const area =
            addr.suburb || addr.neighbourhood || addr.quarter || addr.road;
          const city =
            addr.city || addr.town || addr.village || addr.county;
          const state = addr.state;

          const areaCityState = [area, city, state].filter(Boolean).join(", ");
          const resolvedLocation = areaCityState || data.display_name;

          setSignUpForm((f) => ({ ...f, location: resolvedLocation, latitude, longitude }));
        } catch (err) {
          setLocationError(err.message || "Failed to detect your location. Please enter it manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow access or enter your location manually.");
        } else {
          setLocationError("Couldn't get your location. Please enter it manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };





    const handleVendorUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setVendorLocationError("Location is not supported on this device/browser.");
      return;
    }
    setVendorLocationError("");
    setVendorLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (!data || data.error) throw new Error("Could not resolve address for this location.");

          const addr = data.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.road;
          const city = addr.city || addr.town || addr.village || addr.county;
          const state = addr.state;
          const resolvedAddress = [area, city, state].filter(Boolean).join(", ") || data.display_name;

          setVendorForm((f) => ({ ...f, address: resolvedAddress, latitude, longitude }));
        } catch (err) {
          setVendorLocationError(err.message || "Failed to detect your location. Please enter it manually.");
        } finally {
          setVendorLocating(false);
        }
      },
      (err) => {
        setVendorLocating(false);
        setVendorLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please allow access or enter your location manually."
            : "Couldn't get your location. Please enter it manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleVendorSignUp = async (e) => {
    e.preventDefault();
    setVendorError("");
    setVendorSuccess("");
    setLoading(true);
    const result = await signup({ ...vendorForm, accountType: "vendor" });
    setLoading(false);
    if (!result.success) {
      setVendorError(result.error);
      return;
    }
    setVendorForm({
      fullName: "", phone: "", address: "", latitude: null, longitude: null,
      idType: "aadhaar", idNumber: "",
    });
    setVendorSuccess(result.message || "Request submitted! Please wait for admin approval.");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");
    setLoading(true);
    const result = await login(signInForm.email, signInForm.password);
    setLoading(false);

    if (!result.success) {
      setSignInError(result.error);
      return;
    }

    router.replace("/");
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");
    setLoading(true);
    const result = await signup(signUpForm);
    setLoading(false);
    if (!result.success) {
      setSignUpError(result.error);
      return;
    }
   setSignUpForm({
      businessName: "", fullName: "", email: "", phone: "", location: "",
      latitude: null, longitude: null,
      sellerType: "", gstNumber: "", businessRegNumber: "", panNumber: "",
    });
    setSignUpSuccess(result.message || "Request submitted! Please wait for admin approval.");
  };

  return (
    <div className="auth-body-wrapper">
      <div className={`container ${mode !== "signin" ? "active" : ""} ${mode === "vendor" ? "vendor-active" : ""}`} id="container">
        <div className="form-container sign-up">
          <form onSubmit={handleSignUp}>
            <h1>Become a Seller</h1>
            <span>Submit your details for admin approval</span>
            {signUpSuccess ? (
              <p className="auth-success-text">{signUpSuccess}</p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Business Name"
                  value={signUpForm.businessName}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, businessName: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signUpForm.fullName}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (10 digits)"
                  value={signUpForm.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setSignUpForm((f) => ({ ...f, phone: digitsOnly }));
                  }}
                  pattern="\d{10}"
                  maxLength={10}
                  title="Enter a 10 digit mobile number"
                  required
                />
                <div className="location-input-wrapper location-input-wrapper--inline">
                  <input
                    type="text"
                    placeholder="Location (City, State)"
                    value={signUpForm.location}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, location: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="use-location-btn use-location-btn--inline"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    title="Use my current location"
                  >
                    <span className="btn-icon">
                      <svg viewBox="0 0 24 30" width="20" height="20" fill="currentColor" aria-hidden="true">
                        <path d="M12 1C7.03 1 3 5.03 3 10c0 6.25 7.79 12.98 8.12 13.26.25.22.6.22.85 0C12.31 22.98 20 16.25 20 10c0-4.97-4.03-9-9-9zm0 12a3 3 0 110-6 3 3 0 010 6z" />
                        <ellipse cx="12" cy="26" rx="9" ry="2.4" opacity="0.9" />
                        <ellipse cx="12" cy="26" rx="6.2" ry="1.6" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
                        <ellipse cx="12" cy="26" rx="3.4" ry="0.9" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.3" />
                      </svg>
                    </span>
                    <span className="btn-text">{locating ? "…" : "Detect"}</span>
                  </button>
                </div>
                {locationError && <p className="auth-error-text location-error">{locationError}</p>}

                <select
                  className="auth-select"
                  value={signUpForm.sellerType}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, sellerType: e.target.value }))}
                  required
                >
                  <option value="" disabled>What will you sell?</option>
                  <option value="product">I sell Products</option>
                  <option value="service">I offer Services</option>
                </select>

                <div className="auth-field-hint-wrap">
                  <input
                    type="text"
                    placeholder="GST Number"
                    value={signUpForm.gstNumber}
                    onChange={(e) => {
                      const trimmed = e.target.value.toUpperCase().slice(0, 15);
                      setSignUpForm((f) => ({ ...f, gstNumber: trimmed }));
                    }}
                    maxLength={15}
                  />
                  <span className="auth-field-hint">Don't have a GST number?</span>
                </div>
                <div className="auth-field-hint-wrap">
                  <input
                    type="text"
                    placeholder="Business Registration Number "
                    value={signUpForm.businessRegNumber}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, businessRegNumber: e.target.value }))}
                  />
                  <span className="auth-field-hint">Don't have a business registration number?</span>
                </div>
                <input
                  type="text"
                  placeholder="PAN Number (e.g. ABCDE1234F)"
                  value={signUpForm.panNumber}
                  onChange={(e) => {
                    const trimmed = e.target.value.toUpperCase().slice(0, 10);
                    setSignUpForm((f) => ({ ...f, panNumber: trimmed }));
                  }}
                  maxLength={10}
                />

                {signUpError && <p className="auth-error-text">{signUpError}</p>}
                <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Request"}</button>
              </>
            )}
            <a href="#" className="vendor-link" onClick={(e) => { e.preventDefault(); setMode("vendor"); }}>
              Street Vendor instead? Sign up here
            </a>
          </form>
        </div>

        <div className="form-container vendor-signup">
          <form onSubmit={handleVendorSignUp}>
            <h1>Street Vendor Sign Up</h1>
            <span>Register as a street vendor for admin approval</span>
            {vendorSuccess ? (
              <p className="auth-success-text">{vendorSuccess}</p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={vendorForm.fullName}
                  onChange={(e) => setVendorForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (10 digits)"
                  value={vendorForm.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setVendorForm((f) => ({ ...f, phone: digitsOnly }));
                  }}
                  pattern="\d{10}"
                  maxLength={10}
                  title="Enter a 10 digit mobile number"
                  required
                />
                <div className="location-input-wrapper location-input-wrapper--inline">
                  <input
                    type="text"
                    placeholder="Address (City, State)"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="use-location-btn use-location-btn--inline"
                    onClick={handleVendorUseMyLocation}
                    disabled={vendorLocating}
                    title="Use my current location"
                  >
                    <span className="btn-icon">
                      <svg viewBox="0 0 24 30" width="20" height="20" fill="currentColor" aria-hidden="true">
                        <path d="M12 1C7.03 1 3 5.03 3 10c0 6.25 7.79 12.98 8.12 13.26.25.22.6.22.85 0C12.31 22.98 20 16.25 20 10c0-4.97-4.03-9-9-9zm0 12a3 3 0 110-6 3 3 0 010 6z" />
                        <ellipse cx="12" cy="26" rx="9" ry="2.4" opacity="0.9" />
                        <ellipse cx="12" cy="26" rx="6.2" ry="1.6" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
                        <ellipse cx="12" cy="26" rx="3.4" ry="0.9" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.3" />
                      </svg>
                    </span>
                    <span className="btn-text">{vendorLocating ? "…" : "Detect"}</span>
                  </button>
                </div>
                {vendorLocationError && <p className="auth-error-text location-error">{vendorLocationError}</p>}

                <select
                  className="auth-select"
                  value={vendorForm.idType}
                  onChange={(e) => setVendorForm((f) => ({ ...f, idType: e.target.value, idNumber: "" }))}
                  required
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                </select>
                <input
                  type="text"
                  placeholder={vendorForm.idType === "pan" ? "PAN Number (e.g. ABCDE1234F)" : "Aadhaar Number (12 digits)"}
                  value={vendorForm.idNumber}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase();
                    const cleaned = vendorForm.idType === "pan"
                      ? raw.slice(0, 10)
                      : raw.replace(/\D/g, "").slice(0, 12);
                    setVendorForm((f) => ({ ...f, idNumber: cleaned }));
                  }}
                  maxLength={vendorForm.idType === "pan" ? 10 : 12}
                  required
                />

                {vendorError && <p className="auth-error-text">{vendorError}</p>}
                <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Request"}</button>
              </>
            )}
            <a href="#" className="vendor-link" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>
              Registering a business instead?
            </a>
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleSignIn}>
            <h1>Sign In</h1>
            {/* <span>Sellers &amp; admins: email · Street vendors: phone number</span> */}
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={signInForm.email}
              onChange={(e) => setSignInForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signInForm.password}
              onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            {signInError && <p className="auth-error-text">{signInError}</p>}
            <a href="#">Forget Your Password?</a>
            <button type="submit" disabled={loading}>{loading ? "Please wait..." : "Sign In"}</button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button className="hidden" id="login" onClick={() => setMode("signin")}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button className="hidden" id="register" onClick={() => setMode("signup")}>
                Sign Up
              </button>
              <a href="#" className="vendor-link" onClick={(e) => { e.preventDefault(); setMode("vendor"); }}>
                Street Vendor? Sign up here
              </a>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}