"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useRequestNotifications } from "@/hooks/useRequestNotifications";
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
    label: "Products",
    href: "/products",
    hasSubmenu: true,
      submenu: [
        { label: "All Products", href: "/products" },
        { label: "Add New Product", href: "/products/new" },
        { label: "Inventory", href: "/products/inventory" },
        { label: "Product Requests", href: "/products/requests" },
        { label: "Product Edit Requests", href: "/products/edit-requests" },
        { label: "Regional Famous Products", href: "/products/regional" },
        { label: "Regional Famous Products Requests", href: "/products/regional-requests" },
        { label: "Fresh Delivery Requests", href: "/products/fresh-requests" },
      ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Services",
    href: "/services",
    hasSubmenu: true,
    submenu: [
      { label: "All Services", href: "/services" },
      { label: "Add New Service", href: "/services/new" },
      { label: "Service Requests", href: "/services/requests" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    label: "Categories",
    href: "/categories",
    hasSubmenu: true,
    submenu: [
      { label: "All Categories", href: "/categories" },
      { label: "Add New Category", href: "/categories/new" },
      { label: "All Service Categories", href: "/categories/services" },
      { label: "Add New Service Category", href: "/categories/new-service" },
      { label: "Fresh Delivery Categories", href: "/categories/fresh" },
      { label: "Add Fresh Delivery Category", href: "/categories/new-fresh" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Local Businesses",
    href: "/localbusiness",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M9 21V13h6v8" />
        <path d="M3 9 12 3l9 6" />
      </svg>
    ),
  },
  {
    label: "Sellers",
    href: "/sellers",
    hasSubmenu: true,
    submenu: [
      { label: "All Sellers", href: "/sellers" },
      { label: "Seller Requests", href: "/sellers/requests" },
      { label: "All Street Vendors", href: "/vendors" },
      { label: "Street Vendor Requests", href: "/vendors/requests" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Users / Customers",
    href: "/users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
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
  // {
  //   label: "Coupons & Offers",
  //   href: "/coupons",
  //   icon: (
  //     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
  //       <path d="M9 5H2v7l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42L9 5Z" />
  //       <path d="M6 9.01V9" />
  //     </svg>
  //   ),
  // },
  {
    label: "Banners",
    href: "/banners",
    hasSubmenu: true,
    submenu: [
      { label: "All Banners", href: "/banners" },
      { label: "Add New Banner", href: "/banners/new" },
      { label: "Banner Requests", href: "/banners/requests" },
    ],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="m3 13 5-5 4 4 5-5 4 4" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    hasSubmenu: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "CMS",
    href: "/cms",
    hasSubmenu: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    hasArrow: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function NavDrawer() {
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
  const { countByLabel: newRequestCountByLabel } = useRequestNotifications();

  // Auto-expand whichever parent's submenu matches the current URL,
  // so the dropdown stays open (and the active dot shows) after navigation.
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
                {newRequestCountByLabel[item.label] > 0 && (
                  <span className="drawer-badge">{newRequestCountByLabel[item.label]}</span>
                )}
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
                {item.hasArrow && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </Link>

              {item.hasSubmenu && item.submenu && isExpanded && (
                <div className="drawer-submenu">
                  {item.submenu.map((sub) => {
                    const subActive = currentSearch ? sub.href === fullPath : sub.href === pathname;
                    return (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`drawer-submenu-item ${subActive ? "active" : ""}`}
                      >
                        <span className="drawer-submenu-dot" />
                        <span className="drawer-submenu-label">{sub.label}</span>
                        {newRequestCountByLabel[sub.label] > 0 && (
                          <span className="drawer-badge drawer-badge-submenu">
                            {newRequestCountByLabel[sub.label]}
                          </span>
                        )}
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