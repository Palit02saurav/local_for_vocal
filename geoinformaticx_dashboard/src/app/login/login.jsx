"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";
import "./login.css";

export default function AuthPage() {
  const [active, setActive] = useState(false);
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
    router.push("/");
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
      <div className={`container ${active ? "active" : ""}`} id="container">
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
                <div className="location-input-wrapper">
                  <input
                    type="text"
                    placeholder="Location (City, State)"
                    value={signUpForm.location}
                    onChange={(e) => setSignUpForm((f) => ({ ...f, location: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="use-location-btn"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    title="Use my current location"
                  >
                    {locating ? "Detecting..." : "📍 Use my location"}
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
                <input
                  type="text"
                  placeholder="Business Registration Number "
                  value={signUpForm.businessRegNumber}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, businessRegNumber: e.target.value }))}
                />
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
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleSignIn}>
            <h1>Sign In</h1>
            <span>or use your email password</span>
            <input
              type="email"
              placeholder="Email"
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
              <button className="hidden" id="login" onClick={() => setActive(false)}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button className="hidden" id="register" onClick={() => setActive(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}