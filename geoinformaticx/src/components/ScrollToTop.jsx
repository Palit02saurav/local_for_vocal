"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
  useEffect(() => {
    // Stop the browser from restoring the old scroll position on refresh
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    // Also reset right before the page unloads, so the saved position is the top
    const toTop = () => window.scrollTo(0, 0);
    window.addEventListener("beforeunload", toTop);
    return () => window.removeEventListener("beforeunload", toTop);
  }, []);

  return null;
}