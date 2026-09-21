"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/nav";
import NavDrawer from "@/components/navdrawer/drawer";
import SellerDrawer from "@/components/navdrawer/sellerDrawer";
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

  if (isPublic) {
    setReady(true);

    return () => {
      cancelled = true;
    };
  }

  checkAuth().then((user) => {
    if (cancelled) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    setRole(user.role || null);
    setReady(true);
  });

  return () => {
    cancelled = true;
  };
}, [pathname, isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!ready) return null;

  return (
    <>
      <AdminNavbar />
      {role === "SUPER_ADMIN" ? <NavDrawer /> : <SellerDrawer />}
      <main className="app-main-content">{children}</main>
    </>
  );
}