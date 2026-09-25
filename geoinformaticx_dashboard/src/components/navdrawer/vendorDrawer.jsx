"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import "./drawer.css";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    hasSubmenu: true,
    submenu: [
      { label: "All Orders", href: "/orders" },
      { label: "Pending", href: "/orders?status=pending" },
      { label: "Shipped", href: "/orders?status=shipped" },
      { label: "Delivered", href: "/orders?status=delivered" },
      { label: "Cancelled", href: "/orders?status=cancelled" },
      { label: "Refunds", href: "/orders?status=refunds" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    label: "Fresh Delivery",
    href: "/fresh-delivery",
    hasSubmenu: true,
    submenu: [
      { label: "All Fresh Products", href: "/fresh-delivery" },
      { label: "Add Fresh Product", href: "/fresh-delivery/new" },
      // { label: "In Progress", href: "/fresh-delivery/in-progress" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "My Store",
    href: "/store",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M9 21V13h6v8" />
        <path d="M3 9 12 3l9 6" />
      </svg>
    ),
  },
  {
    label: "Reviews & Ratings",
    href: "/reviews",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: "Banners",
    href: "/banners",
    hasSubmenu: true,
    submenu: [
      { label: "All Banners", href: "/banners" },
      { label: "Add New Banner", href: "/banners/new" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="m3 13 5-5 4 4 5-5 4 4" />
      </svg>
    ),
  },
  {
    label: "Payouts & Earnings",
    href: "/payouts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

export default function VendorDrawer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

const handleLogout = async () => {
  await logout();
  router.replace("/login");
};
  const currentSearch = searchParams.toString();
  const fullPath = currentSearch ? `${pathname}?${currentSearch}` : pathname;

  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.submenu?.some((sub) => sub.href === fullPath || sub.href === pathname)
    );
    setExpanded(activeParent ? activeParent.label : null);
  }, [pathname, currentSearch]);

  return (
    <aside className="drawer">
      <nav className="drawer-menu">
        {menuItems.map((item) => {
          const isExpanded = expanded === item.label;
          const hasActiveChild = item.submenu?.some(
            (sub) => sub.href === fullPath || sub.href === pathname
          );
          const isActive = item.hasSubmenu ? hasActiveChild : pathname === item.href;

          return (
            <div key={item.label} className="drawer-item-wrapper">
              <Link
                href={item.href}
                className={`drawer-item ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  if (item.hasSubmenu) {
                    e.preventDefault();
                    setExpanded(isExpanded ? null : item.label);
                  }
                }}
              >
                <span className="drawer-icon">{item.icon}</span>
                <span className="drawer-label">{item.label}</span>
                {item.hasSubmenu && (
                  <svg
                    className={`drawer-chevron ${isExpanded ? "open" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </Link>

              {item.hasSubmenu && item.submenu && isExpanded && (
                <div className="drawer-submenu">
                  {item.submenu.map((sub) => {
                    const subActive = sub.href === fullPath;
                    return (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`drawer-submenu-item ${subActive ? "active" : ""}`}
                      >
                        <span className="drawer-submenu-dot" />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button className="drawer-logout" onClick={handleLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Log Out</span>
      </button>
    </aside>
  );
}