"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileModal from "@/components/profileModal/ProfileModal";
import MailModal from "@/components/mailModal/MailModal";
import { useRequestNotifications } from "@/hooks/useRequestNotifications";
import { useMailNotifications } from "@/hooks/useMailNotifications";
import "./nav.css";

export default function AdminNavbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileRef = useRef(null);
  const router = useRouter();
  const isSeller = user?.role !== "SUPER_ADMIN";
  const isSuperAdmin = !isSeller;

  const [mailModalOpen, setMailModalOpen] = useState(false);
  const {
    mails,
    loading: mailLoading,
    unseenCount: unseenMailCount,
    markAllSeen: markMailsSeen,
    refetch: refetchMails,
  } = useMailNotifications(user?.id);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const {
    loading: notifLoading,
    unseenNotifications: notifications,
    markSeen,
  } = useRequestNotifications(isSuperAdmin);

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    setNotifOpen(false);
    markSeen(n.categoryKey);
    router.push(n.href);
  };

const handleLogout = async () => {
  setProfileOpen(false);
  await logout();
  router.replace("/login");
};

  return (
    <header className="admin-navbar">
      {/* Logo */}

      <Link href="/" className="admin-navbar-logo">
        <img src="https://geomaticxweb.s3.ap-south-2.amazonaws.com/website-resources/506c5fc543eb23c40fff6a043d867c66.png" alt="Geoinformaticx" className="admin-navbar-logo-img" />
        <div className="admin-navbar-logo-text">
          <span className="admin-navbar-title">Geoinformaticx</span>
          <span className="admin-navbar-subtitle">
            {user?.role === "SUPER_ADMIN"
              ? "Super Admin Panel"
              : user?.seller_type === "service"
              ? "Service Provider Panel"
              : "Seller Panel"}
          </span>
        </div>
      </Link>

      <div className="admin-navbar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search for orders, products, users, businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-navbar-right">
        <div className="admin-navbar-notif-wrapper" ref={notifRef}>
          <button
            className="admin-navbar-icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="admin-navbar-badge">{notifications.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className="admin-navbar-notif-dropdown">
              <div className="admin-navbar-notif-header">Notifications</div>
              {notifLoading ? (
                <div className="admin-navbar-notif-empty">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="admin-navbar-notif-empty">No new requests.</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className="admin-navbar-notif-item"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <span className={`admin-navbar-notif-dot admin-navbar-notif-dot-${n.type}`} />
                    <div>
                      <p className="admin-navbar-notif-title">{n.title}</p>
                      <p className="admin-navbar-notif-subtitle">{n.subtitle}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          className="admin-navbar-icon-btn"
          aria-label="Mail"
          onClick={() => {
            setMailModalOpen(true);
            markMailsSeen();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 6-10 7L2 6" />
          </svg>
          {unseenMailCount > 0 && (
            <span className="admin-navbar-badge">{unseenMailCount}</span>
          )}
        </button>

        <button className="admin-navbar-icon-btn" aria-label="Help" onClick={() => router.push("/help")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M9.5 9a2.5 2.5 0 0 1 4.9.75c0 1.75-2.4 1.75-2.4 3.5" />
            <circle cx="12" cy="17" r="0.6" fill="#333" stroke="none" />
          </svg>
        </button>

        <div className="admin-navbar-profile-wrapper" ref={profileRef}>
          <div
            className="admin-navbar-profile"
            onClick={() => setProfileOpen((o) => !o)}
            style={{ cursor: "pointer" }}
          >
            <div className="admin-navbar-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="admin-navbar-profile-text">
              <span className="admin-navbar-profile-name">{user?.full_name || "Loading..."}</span>
              <span className="admin-navbar-profile-role">
                {user?.role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : user?.seller_type === "service"
                  ? "Service Provider"
                  : "Seller"}
              </span>
            </div>
            <svg
              className={`admin-navbar-chevron ${profileOpen ? "open" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {profileOpen && (
            <div className="admin-navbar-dropdown">
              {isSeller && (
                <button
                  className="admin-navbar-dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setProfileModalOpen(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
                  </svg>
                  Profile
                </button>
              )}
              <Link
                href="/settings"
                className="admin-navbar-dropdown-item"
                onClick={() => setProfileOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>
              <button className="admin-navbar-dropdown-item admin-navbar-dropdown-logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
      {mailModalOpen && (
        <MailModal
          isSuperAdmin={isSuperAdmin}
          mails={mails}
          loading={mailLoading}
          onSent={refetchMails}
          onClose={() => setMailModalOpen(false)}
        />
      )}
    </header>
  );
}