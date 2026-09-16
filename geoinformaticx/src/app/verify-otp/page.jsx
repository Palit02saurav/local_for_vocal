"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtp, resendOtp } from "@/lib/auth";
import "./verify-otp.css";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await verifyOtp(email, otp);
    setLoading(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.message);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setError("");
    const result = await resendOtp(email);
    setResendMsg(result.success ? "A new OTP has been sent to your email." : result.message);
  };

  return (
    <div className="otp-page-wrapper">
      <div className="otp-card">
        <h1>Verify Your Account</h1>
        <p>Enter the 4-digit code sent to <strong>{email}</strong></p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
            className="otp-input"
            autoFocus
          />
          {error && <p className="otp-error">{error}</p>}
          <button type="submit" disabled={loading || otp.length !== 4} className="otp-submit-btn">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button onClick={handleResend} className="otp-resend-btn">Resend OTP</button>
        {resendMsg && <p className="otp-resend-msg">{resendMsg}</p>}
      </div>
    </div>
  );
}