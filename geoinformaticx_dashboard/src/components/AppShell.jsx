"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/nav";
import NavDrawer from "@/components/navdrawer/drawer";
import SellerDrawer from "@/components/navdrawer/sellerDrawer";
import VendorDrawer from "@/components/navdrawer/vendorDrawer";
import { checkAuth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState(null);
  const isPublic = PUBLIC_ROUTES.includes(pathname);

useEffect(() => {
  let cancelled = false;

  const handleAuthChange = async () => {
    if (isPublic) {
      setReady(false);
      setRole(null);
      return;
    }

    const user = await checkAuth();

    if (cancelled) return;

    if (!user) {
      setReady(false);
      setRole(null);
      router.replace("/login");
      return;
    }

    setRole(user.role || null);
    setReady(true);
  };

  handleAuthChange();

  window.addEventListener("auth:changed", handleAuthChange);

  return () => {
    cancelled = true;
    window.removeEventListener("auth:changed", handleAuthChange);
  };
}, [isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!ready) return null;

  return (
    <>
      <AdminNavbar />
      {role === "SUPER_ADMIN" ? <NavDrawer /> : role === "VENDOR" ? <VendorDrawer /> : <SellerDrawer />}
      <main className="app-main-content">{children}</main>
    </>
  );
}