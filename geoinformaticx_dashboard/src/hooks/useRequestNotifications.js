"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";

export const REQUEST_CATEGORIES = [
  {
    key: "sellers",
    endpoint: "/sellers/requests",
    dataKey: "sellers",
    parentLabel: "Sellers",
    submenuLabel: "Seller Requests",
    pagePath: "/sellers/requests",
    storageKey: "seen_seller_request_ids",
    notifType: "seller",
    notifTitle: "New seller request",
    notifSubtitle: (r) => r.store_name || r.full_name,
  },
  {
    key: "products",
    endpoint: "/products/requests",
    dataKey: "products",
    parentLabel: "Products",
    submenuLabel: "Product Requests",
    pagePath: "/products/requests",
    storageKey: "seen_product_request_ids",
    notifType: "product",
    notifTitle: "New product request",
    notifSubtitle: (r) => r.name,
  },
  {
    key: "services",
    endpoint: "/services/requests",
    dataKey: "services",
    parentLabel: "Services",
    submenuLabel: "Service Requests",
    pagePath: "/services/requests",
    storageKey: "seen_service_request_ids",
    notifType: "service",
    notifTitle: "New service request",
    notifSubtitle: (r) => r.name,
  },
];

/**
 * Shared tracking for pending seller/product/service requests.
 * Used by both the navbar notification bell and the sidebar badges so
 * they stay in sync: once a category's requests page has been visited
 * (or a notification for it has been clicked), it's marked "seen" in
 * localStorage and won't show up as new again until a fresh request
 * arrives.
 */
export function useRequestNotifications(enabled = true) {
  const pathname = usePathname();
  const [recordsByCategory, setRecordsByCategory] = useState({});
  const [seenIdsByCategory, setSeenIdsByCategory] = useState({});
  const [loading, setLoading] = useState(false);

  // Load previously-seen ids per category on mount.
  useEffect(() => {
    const seen = {};
    REQUEST_CATEGORIES.forEach((cat) => {
      try {
        seen[cat.key] = JSON.parse(localStorage.getItem(cat.storageKey)) || [];
      } catch {
        seen[cat.key] = [];
      }
    });
    setSeenIdsByCategory(seen);
  }, []);

  const fetchPending = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const results = await Promise.allSettled(
      REQUEST_CATEGORIES.map((cat) => api.get(cat.endpoint))
    );
    setRecordsByCategory((prev) => {
      const next = { ...prev };
      results.forEach((res, i) => {
        const cat = REQUEST_CATEGORIES[i];
        if (res.status === "fulfilled") {
          next[cat.key] = res.value.data.data?.[cat.dataKey] || [];
        }
      });
      return next;
    });
    setLoading(false);
  }, [enabled]);  

  useEffect(() => {
    if (!enabled) return;
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [enabled, fetchPending]);

  const markSeen = useCallback(
    (categoryKey) => {
      const cat = REQUEST_CATEGORIES.find((c) => c.key === categoryKey);
      if (!cat) return;
      const pendingIds = (recordsByCategory[categoryKey] || []).map((r) => r.id);
      setSeenIdsByCategory((prev) => ({ ...prev, [categoryKey]: pendingIds }));
      localStorage.setItem(cat.storageKey, JSON.stringify(pendingIds));
    },
    [recordsByCategory]
  );

  // Visiting a requests page clears the badge/notification for that category.
  useEffect(() => {
    const cat = REQUEST_CATEGORIES.find((c) => c.pagePath === pathname);
    if (!cat) return;
    const pending = recordsByCategory[cat.key] || [];
    if (pending.length === 0) return;
    markSeen(cat.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, recordsByCategory]);

  const countByLabel = {};
  const unseenNotifications = [];

  REQUEST_CATEGORIES.forEach((cat) => {
    const records = recordsByCategory[cat.key] || [];
    const seenIds = seenIdsByCategory[cat.key] || [];
    const unseenRecords = records.filter((r) => !seenIds.includes(r.id));

    countByLabel[cat.parentLabel] = unseenRecords.length;
    countByLabel[cat.submenuLabel] = unseenRecords.length;

    unseenRecords.forEach((record) => {
      unseenNotifications.push({
        id: `${cat.key}-${record.id}`,
        type: cat.notifType,
        title: cat.notifTitle,
        subtitle: cat.notifSubtitle(record),
        href: cat.pagePath,
        categoryKey: cat.key,
      });
    });
  });

  return { loading, countByLabel, unseenNotifications, markSeen };
}