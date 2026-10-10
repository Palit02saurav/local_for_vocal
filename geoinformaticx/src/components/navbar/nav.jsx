"use client";

import { useState, useEffect } from "react";
import { getCartCount } from "@/lib/cart";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getWishlist } from "@/lib/wishlist";
import { getCurrentUser, signOut } from "@/lib/auth";
import api from "@/lib/api";
// import { PRODUCT_CATEGORIES } from "@/lib/categories";
import {
  FaHome,
  FaRegStar,
  FaBolt,
  FaShoppingBag,
  FaThLarge,
  FaRegFileAlt,
  FaPhoneAlt,
  FaStore,
  FaArrowRight,
  FaChevronDown,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import "./nav.css";

export default function Navbar() {
  const pathname = usePathname();
  const iconActive = (href) =>
    pathname === href || pathname.startsWith(href + "/") ? "active" : "";
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const [suggestions, setSuggestions] = useState([]);

  // fetch suggestions from the database, 250ms after the user stops typing
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/search/suggestions?q=${encodeURIComponent(q)}`);
        if (!cancelled) setSuggestions(res.data?.data?.suggestions || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSuggestionClick = (s) => {
    setSearchQuery(s.label);
    setShowSuggestions(false);
    if (s.type === "store" && s.id) router.push(`/store/${s.id}`);
    else if (s.type === "service" && s.sku) router.push(`/services/${s.sku}`);
    else if (s.type === "product" && s.sku) router.push(`/shop/${s.sku}`);
    else router.push(`/shop?q=${encodeURIComponent(s.label)}`);
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

  // const SERVICE_MENU = ["Cleaning", "Repair", "Fashion", "Creative", "Food", "Education", "Wellness", "Beauty"];

  // const navLinks = [
  //   { label: "Home", href: "/", icon: FaHome },
  //   { label: "Region Famous", href: "/map", icon: FaRegStar },
  //   { label: "10-Min Fresh Delivery", href: "/business", icon: FaBolt },
  //   {
  //     label: "Products",
  //     href: "/shop",
  //     icon: FaShoppingBag,
  //     menu: PRODUCT_CATEGORIES.map((c) => ({
  //       label: c.name,
  //       href: `/shop?category=${encodeURIComponent(c.name)}`,
  //     })),
  //   },
  //   {
  //     label: "Services",
  //     href: "/services",
  //     icon: FaThLarge,
  //     menu: SERVICE_MENU.map((c) => ({
  //       label: c,
  //       href: `/services?category=${encodeURIComponent(c)}`,
  //     })),
  //   },
  //   { label: "About Us", href: "/about", icon: FaRegFileAlt },
  //   { label: "Contact Us", href: "/contact", icon: FaPhoneAlt },
  // ];


    const navLinks = [
      { label: "Home", href: "/", icon: FaHome },
      { label: "Region Famous", href: "/map", icon: FaRegStar },
      { label: "10-Min Fresh Delivery", href: "/business", icon: FaBolt },
      { label: "Products", href: "/shop", icon: FaShoppingBag },
      { label: "Services", href: "/services", icon: FaThLarge },
      { label: "About Us", href: "/about", icon: FaRegFileAlt },
      { label: "Contact Us", href: "/contact", icon: FaPhoneAlt },
    ];

    return (
    <header className="navbar-header">
      <div className="navbar-top">
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">
            <img
              src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png"
              width="46"
              height="46"
              alt="Geomaticx"
            />
          </div>
          <div className="logo-text">
            <span className="logo-name">
              Geo<span className="logo-accent">maticx</span>
            </span>
            <span className="logo-tagline">Discover. Support. Grow Local.</span>
          </div>
        </Link>

        <div className="navbar-search">
          <div className="search-input-wrap">
            <FaSearch className="search-lead-icon" />
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
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                  if (pathname === "/shop") router.push("/shop");
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            className="search-btn"
            aria-label="Search"
            onClick={() => {
              if (searchQuery.trim()) {
                router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          >
            <FaSearch />
            <span>Search</span>
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s) => (
                <div
                  key={`${s.type}-${s.label}`}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <FaSearch size={12} color="#888" />
                  <span style={{ flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
          )}  
        </div>

        <div className="navbar-icons">
          <Link href="/trackorder" className={`nav-icon-btn ${iconActive("/trackorder")}`}>
            <span className="nav-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </span>
            <span className="icon-label">Track Order</span>
          </Link>

          <Link href="/trackservice" className={`nav-icon-btn ${iconActive("/trackservice")}`}>
            <span className="nav-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </span>
            <span className="icon-label">Track Services</span>
          </Link>

          <Link href="/wishlist" className={`nav-icon-btn ${iconActive("/wishlist")}`}>
            <span className="nav-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="cart-badge wishlist-badge">{wishlistCount}</span>
              )}
            </span>
            <span className="icon-label">Wishlist</span>
          </Link>

          <Link href="/cart" className={`nav-icon-btn cart-icon-btn ${iconActive("/cart")}`}>
            <span className="nav-icon-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </span>
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
                className="nav-profile-trigger"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <span className="profile-avatar-circle">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </span>
                <span className="profile-name">{user.name?.split(" ")[0] || "Profile"}</span>
                <FaChevronDown className="profile-chevron" />
              </button>
            ) : (
              <Link href="/login" className="nav-icon-btn">
                <span className="nav-icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
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
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <div key={link.label} className="nav-item">
                <Link
                  href={link.href}
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-label={link.label}
                >
                  <span className="nav-link-iconwrap">
                    <Icon className="nav-link-icon" />
                  </span>
                  <span className="nav-link-title">{link.label}</span>
                </Link>

                {link.menu && (
                  <div className="nav-dropdown">
                    <div className="nav-dropdown-card">
                      {link.menu.map((item) => (
                        <Link key={item.label} href={item.href} className="nav-dropdown-item">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Link href="/sell" className="sell-with-us-btn">
          <FaStore />
          <span>Sell With Us</span>
          <FaArrowRight />
        </Link>
      </div>
    </header>
  );

  // return (
  //   <header className="navbar-header">
     
  //     <div className="navbar-top">
       
  //       <Link href="/" className="navbar-logo">
      
  //         <div className="logo-icon">
  //           <img src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png" width="36" height="36" />
  //         </div>
  //         <div className="logo-text">
  //           <span className="logo-name">Geoinformaticx</span>
  //           <span className="logo-tagline">Discover. Support. Grow Local.</span>
  //         </div>
  //       </Link>

        
  //       <div className="navbar-search" style={{ position: "relative" }}>
  //         <input
  //           type="text"
  //           className="search-input"
  //           placeholder="Search for local products, businesses..."
  //           value={searchQuery}
  //           onChange={(e) => {
  //             const value = e.target.value;
  //             setSearchQuery(value);
  //             setShowSuggestions(true);
  //             if (value.trim() === "" && pathname === "/shop") {
  //               router.push("/shop");
  //             }
  //           }}
  //           onKeyDown={(e) => {
  //             if (e.key === "Enter" && searchQuery.trim()) {
  //               setShowSuggestions(false);
  //               router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  //             }
  //             if (e.key === "Escape") {
  //               setShowSuggestions(false);
  //               setSearchQuery("");
  //               if (pathname === "/shop") router.push("/shop");
  //             }
  //             if (e.key === "Backspace" && searchQuery.length === 1) {
  //               setSearchQuery("");
  //               setShowSuggestions(false);
  //               if (pathname === "/shop") router.push("/shop");
  //             }
  //           }}
  //           onFocus={() => setShowSuggestions(true)}
  //           onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
  //           autoComplete="off"
  //         />
  //         {showSuggestions && filteredSuggestions.length > 0 && (
  //           <div className="search-suggestions">
  //             {filteredSuggestions.map((s) => (
  //               <div
  //                 key={s}
  //                 className="suggestion-item"
  //                 onMouseDown={() => handleSuggestionClick(s)}
  //               >
  //                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //                   <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  //                 </svg>
  //                 {s}
  //               </div>
  //             ))}
  //           </div>
  //         )}
  //         <div className="search-divider" />
  //         <div className="category-select-wrapper">
  //           <select
  //             className="category-select"
  //             value={selectedCategory}
  //             onChange={(e) => setSelectedCategory(e.target.value)}
  //           >
  //             {categories.map((cat) => (
  //               <option key={cat} value={cat}>
  //                 {cat}
  //               </option>
  //             ))}
  //           </select>
  //           <span className="select-arrow">&#8964;</span>
  //         </div>
  //         <button className="search-btn" aria-label="Search" onClick={() => {
  //           if (searchQuery.trim()) {
  //             router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  //           }
  //         }}>
  //           <svg
  //             width="18"
  //             height="18"
  //             viewBox="0 0 24 24"
  //             fill="none"
  //             stroke="white"
  //             strokeWidth="2.5"
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //           >
  //             <circle cx="11" cy="11" r="8" />
  //             <line x1="21" y1="21" x2="16.65" y2="16.65" />
  //           </svg>
  //         </button>
  //       </div>

     
  //       <div className="navbar-icons">
      
  //         <Link href="/trackorder" className="nav-icon-btn">
  //           <svg
  //             width="22"
  //             height="22"
  //             viewBox="0 0 24 24"
  //             fill="none"
  //             stroke="#333"
  //             strokeWidth="1.8"
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //           >
  //             <rect x="1" y="3" width="15" height="13" rx="2" />
  //             <path d="M16 8h4l3 3v5h-7V8z" />
  //             <circle cx="5.5" cy="18.5" r="2.5" />
  //             <circle cx="18.5" cy="18.5" r="2.5" />
  //           </svg>
  //           <span className="icon-label">Track Order</span>
  //         </Link>

  //         <Link href="/trackservice" className="nav-icon-btn">
  //           <svg
  //             width="22"
  //             height="22"
  //             viewBox="0 0 24 24"
  //             fill="none"
  //             stroke="#333"
  //             strokeWidth="1.8"
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //           >
  //             <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  //           </svg>
  //           <span className="icon-label">Track Services</span>
  //         </Link>

        
  //         <Link href="/wishlist" className="nav-icon-btn">
  //           <div className="cart-wrapper">
  //             <svg
  //               width="22"
  //               height="22"
  //               viewBox="0 0 24 24"
  //               fill="none"
  //               stroke="#333"
  //               strokeWidth="1.8"
  //               strokeLinecap="round"
  //               strokeLinejoin="round"
  //             >
  //               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  //             </svg>
  //             {wishlistCount > 0 && (
  //               <span className="cart-badge">{wishlistCount}</span>
  //             )}
  //           </div>
  //           <span className="icon-label">Wishlist</span>
  //         </Link>

          
  //         <Link href="/cart" className="nav-icon-btn cart-icon-btn">
  //           <div className="cart-wrapper">
  //             <svg
  //               width="22"
  //               height="22"
  //               viewBox="0 0 24 24"
  //               fill="none"
  //               stroke="#333"
  //               strokeWidth="1.8"
  //               strokeLinecap="round"
  //               strokeLinejoin="round"
  //             >
  //               <circle cx="9" cy="21" r="1" />
  //               <circle cx="20" cy="21" r="1" />
  //               <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  //             </svg>
  //             {cartCount > 0 && (
  //               <span className="cart-badge">{cartCount}</span>
  //             )}
  //           </div>
  //           <span className="icon-label">Cart</span>
  //         </Link>

  //         <div
  //           className="nav-profile-wrapper"
  //           onBlur={(e) => {
  //             if (!e.currentTarget.contains(e.relatedTarget)) setShowProfileMenu(false);
  //           }}
  //         >
  //           {user ? (
  //             <button
  //               type="button"
  //               className="nav-icon-btn nav-profile-trigger"
  //               onClick={() => setShowProfileMenu((v) => !v)}
  //             >
  //               <div className="profile-avatar-circle">
  //                 {user.name?.charAt(0).toUpperCase() || "?"}
  //               </div>
  //               <span className="icon-label">{user.name?.split(" ")[0] || "Profile"}</span>
  //             </button>
  //           ) : (
  //             <Link href="/login" className="nav-icon-btn">
  //               <svg
  //                 width="22" height="22" viewBox="0 0 24 24" fill="none"
  //                 stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
  //               >
  //                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  //                 <circle cx="12" cy="7" r="4" />
  //               </svg>
  //               <span className="icon-label">Login / Sign Up</span>
  //             </Link>
  //           )}

  //           {user && showProfileMenu && (
  //             <div className="nav-profile-dropdown">
  //               <Link
  //                 href="/profile"
  //                 className="nav-profile-dropdown-item"
  //                 onClick={() => setShowProfileMenu(false)}
  //               >
  //                 Profile
  //               </Link>
  //               <button
  //                 type="button"
  //                 className="nav-profile-dropdown-item nav-profile-logout"
  //                 onClick={handleLogout}
  //               >
  //                 Logout
  //               </button>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     </div>    

     
  //     <div className="navbar-bottom">
  //       <nav className="nav-links">
  //         {navLinks.map((link) => (
  //           <Link
  //             key={link.label}
  //             href={link.href}
  //             className={`nav-link ${pathname === link.href ? "active" : ""}`}
  //           >
  //             {link.label}
  //           </Link>
  //         ))}
  //       </nav>

  //       <Link href="/sell" className="sell-with-us-btn">
  //         Sell With Us
  //       </Link>
  //     </div>
  //   </header>
  // );
}