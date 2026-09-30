"use client";

import { useEffect, useState } from "react";
import "./splash.css";

const LOGO_URL =
  "https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only show once per browser session, not on every page navigation.
    const alreadyShown = sessionStorage.getItem("splashShown");
    if (alreadyShown) return;

    setVisible(true);
    sessionStorage.setItem("splashShown", "true");

    const fadeTimer = setTimeout(() => setFadingOut(true), 1800);
    const removeTimer = setTimeout(() => setVisible(false), 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-overlay ${fadingOut ? "splash-fade-out" : ""}`}>
      <div className="splash-content">
        <img src={LOGO_URL} alt="Geoinformaticx" className="splash-logo" />
        <h1 className="splash-title">Geoinformaticx</h1>
        <p className="splash-subtitle">by Geomaticx</p>
      </div>
    </div>
  );
}