"use client";

import { useState, useEffect } from "react";
import ReviewsPage from "./reviews";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function Page() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/reviews/seller`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setReviews(data.data?.reviews || []))
      .catch((err) => console.error("Failed to load reviews:", err))
      .finally(() => setLoading(false));
  }, []);

  return <ReviewsPage reviews={reviews} loading={loading} />;
}