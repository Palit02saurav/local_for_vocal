"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth";
import "./login.css";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [isSignUpActive, setIsSignUpActive] = useState(false);

  const [signUpData, setSignUpData] = useState({ name: "", email: "", phone: "", password: "" });
  const [signUpError, setSignUpError] = useState("");

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signInError, setSignInError] = useState("");

  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpLoading) return; // guard against double-submits
    setSignUpError("");
    setSignUpLoading(true);
    const result = await signUp(signUpData);
    setSignUpLoading(false);
    if (result.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(signUpData.email)}`);
    } else {
      setSignUpError(result.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");
    const result = await signIn(signInData);
    if (result.success) {
      router.push(redirectTo);
    } else {
      setSignInError(result.message);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div
        className={`container ${isSignUpActive ? "right-panel-active" : ""}`}
        id="container"
      >
      {/* Sign Up */}
      <div className="form-container sign-up-container">
        <form onSubmit={handleSignUp}>
          <h1>Create Account</h1>
          {signUpError && (
            <p style={{ color: "#ff4b2b", fontSize: 12, margin: "0 0 8px" }}>{signUpError}</p>
          )}
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            value={signUpData.name}
            onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={signUpData.email}
            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Mobile Number (10 digits)"
            required
            value={signUpData.phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
              setSignUpData({ ...signUpData, phone: digitsOnly });
            }}
            pattern="\d{10}"
            maxLength={10}
            title="Enter a 10 digit mobile number"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={signUpData.password}
            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
          />
          <button type="submit" disabled={signUpLoading}>
            {signUpLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
      </div>

      {/* Sign In */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleSignIn}>
          <h1>Sign in</h1>
          {signInError && (
            <p style={{ color: "#ff4b2b", fontSize: 12, margin: "0 0 8px" }}>{signInError}</p>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={signInData.email}
            onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={signInData.password}
            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
          />
          <a href="#">Forgot Your Password?</a>
          <button type="submit">Sign In</button>
        </form>
      </div>

      {/* Overlay */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back</h1>
            <p>To keep connected with us please login with your personal info</p>
            <button className="ghost" id="signIn" onClick={() => setIsSignUpActive(false)}>
              Sign In
            </button>
          </div>

          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter Your Personal Details and start Journey with us</p>
            <button className="ghost" id="signUp" onClick={() => setIsSignUpActive(true)}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}