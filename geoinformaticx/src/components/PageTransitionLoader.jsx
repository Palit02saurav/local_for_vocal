"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Loader from "@/components/loader/Loader";

const MIN_MS = 900;       // minimum time the loader stays visible
const MAX_MS = 8000;      // safety: never hang longer than this

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const startedAt = useRef(0);
  const hideTimer = useRef(null);
  const safetyTimer = useRef(null);
  const firstRender = useRef(true);

  const start = () => {
    if (startedAt.current) return;
    startedAt.current = Date.now();
    setShow(true);
    clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(stop, MAX_MS);
  };

  const stop = () => {
    clearTimeout(hideTimer.current);
    clearTimeout(safetyTimer.current);
    startedAt.current = 0;
    setShow(false);
  };

  // Start the loader as soon as an internal link is clicked
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = e.target.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page / query-only change

      start();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // When the new page is in, keep the loader up until MIN_MS has passed
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    start(); // covers router.push() navigations that had no click
    const elapsed = Date.now() - startedAt.current;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(stop, Math.max(MIN_MS - elapsed, 0));
  }, [pathname]);

  if (!show) return null;
  return <Loader fullScreen label="Loading" />;
}