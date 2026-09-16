"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export function useMailNotifications(userId) {
  const storageKey = `seen_mail_ids_${userId ?? "anon"}`;
  const [mails, setMails] = useState([]);
  const [seenIds, setSeenIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      setSeenIds(JSON.parse(localStorage.getItem(storageKey)) || []);
    } catch {
      setSeenIds([]);
    }
  }, [storageKey]);

  const fetchMails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/mails");
      setMails(res.data.data?.mails || []);
    } catch {
      // keep last known list on failure
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMails();
    const interval = setInterval(fetchMails, 30000);
    return () => clearInterval(interval);
  }, [fetchMails]);

  const markAllSeen = useCallback(() => {
    const ids = mails.map((m) => m.id);
    setSeenIds(ids);
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }, [mails, storageKey]);

  const unseenCount = mails.filter((m) => !seenIds.includes(m.id)).length;

  return { mails, loading, unseenCount, markAllSeen, refetch: fetchMails };
}