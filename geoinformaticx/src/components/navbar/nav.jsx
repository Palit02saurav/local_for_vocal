"use client";

import { useState, useEffect } from "react";
import { getCartCount } from "@/lib/cart";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getWishlist } from "@/lib/wishlist";
import { getCurrentUser, signOut } from "@/lib/auth";
import "./nav.css";

export default function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const allSuggestions = [
    "Handicrafts", "Handmade Tribal Bag", "Handwoven Wall Hanging", "Handmade Herbal Soap",
    "Organic Wild Honey", "Organic Spices", "Organic Cotton",
    "Local Food", "Local Artisans", "Local Businesses",
    "Terracotta Cooking Pot", "Terracotta Decor",
    "Masala Tea Blend", "Masala Spices",
    "Bamboo Craft Set", "Bamboo Products",
    "Wooden Jewellery Box", "Wooden Decor",
    "Handwoven Cotton Stole", "Handwoven Baskets",
    "Cold Pressed Mustard Oil", "Clay Diya Set",
    "Clothing", "Clothing Accessories",
    "Home Decor", "Home Essentials",
    "Agriculture", "Art & Decor",
    "Traditional", "Regional Specialties", "Services",
  ];

const filteredSuggestions = searchQuery.trim().length > 0
    ? allSuggestions.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSuggestionClick = (s) => {
    setSearchQuery(s);
    setShowSuggestions(false);
    router.push(`/shop?q=${encodeURIComponent(s)}`);
  };
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = async () => {
      if (!getCurrentUser()) {
        setCartCount(0);
        return;
      }
      setCartCount(await getCartCount());
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const list = await getWishlist();
      setWishlistCount(list.length);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, []);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const updateUser = () => setUser(getCurrentUser());
    updateUser();
    window.addEventListener("storage", updateUser);
    return () => window.removeEventListener("storage", updateUser);
  }, []);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

const handleLogout = async () => {
  setShowProfileMenu(false);
  await signOut();
  router.replace("/");
};
  const categories = [
    "All Categories",
    "Handicrafts",
    "Local Food",
    "Organic",
    "Clothing",
    "Home Decor",
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Region Famous", href: "/map" },
    { label: "10-Min Fresh Delivery", href: "/business" },  
    { label: "Shop", href: "/shop" },
    { label: "Services", href: "/services" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <header className="navbar-header">
     
      <div className="navbar-top">
       
        <Link href="/" className="navbar-logo">
      
          <div className="logo-icon">
            <img src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png" width="36" height="36" />
          </div>
          <div className="logo-text">
            <span className="logo-name">Geoinformaticx</span>
            <span className="logo-tagline">Discover. Support. Grow Local.</span>
          </div>
        </Link>

        
        <div className="navbar-search" style={{ position: "relative" }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for local products, businesses..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              setShowSuggestions(true);
              if (value.trim() === "" && pathname === "/shop") {
                router.push("/shop");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                setShowSuggestions(false);
                router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
              }
              if (e.key === "Escape") {
                setShowSuggestions(false);
                setSearchQuery("");
                if (pathname === "/shop") router.push("/shop");
              }
              if (e.key === "Backspace" && searchQuery.length === 1) {
                setSearchQuery("");
                setShowSuggestions(false);
                if (pathname === "/shop") router.push("/shop");
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoComplete="off"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="search-suggestions">
              {filteredSuggestions.map((s) => (
                <div
                  key={s}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          )}
          <div className="search-divider" />
          <div className="category-select-wrapper">
            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="select-arrow">&#8964;</span>
          </div>
          <button className="search-btn" aria-label="Search" onClick={() => {
            if (searchQuery.trim()) {
              router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

     
        <div className="navbar-icons">
      
          <Link href="/trackorder" className="nav-icon-btn">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="icon-label">Track Order</span>
          </Link>

          <Link href="/trackservice" className="nav-icon-btn">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span className="icon-label">Track Services</span>
          </Link>

        
          <Link href="/wishlist" className="nav-icon-btn">
            <div className="cart-wrapper">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="cart-badge">{wishlistCount}</span>
              )}
            </div>
            <span className="icon-label">Wishlist</span>
          </Link>

          
          <Link href="/cart" className="nav-icon-btn cart-icon-btn">
            <div className="cart-wrapper">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </div>
            <span className="icon-label">Cart</span>
          </Link>

          <div
            className="nav-profile-wrapper"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setShowProfileMenu(false);
            }}
          >
            {user ? (
              <button
                type="button"
                className="nav-icon-btn nav-profile-trigger"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <div className="profile-avatar-circle">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="icon-label">{user.name?.split(" ")[0] || "Profile"}</span>
              </button>
            ) : (
              <Link href="/login" className="nav-icon-btn">
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="icon-label">Login / Sign Up</span>
              </Link>
            )}

            {user && showProfileMenu && (
              <div className="nav-profile-dropdown">
                <Link
                  href="/profile"
                  className="nav-profile-dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="nav-profile-dropdown-item nav-profile-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>    

     
      <div className="navbar-bottom">
        <nav className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/sell" className="sell-with-us-btn">
          Sell With Us
        </Link>
      </div>
    </header>
  );
}