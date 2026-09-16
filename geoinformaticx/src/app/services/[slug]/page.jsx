import axios from "axios";
import ServiceDetail from "./service";
import { notFound } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getService(slug) {
  try {
    const { data } = await axios.get(`${API_BASE}/services/public/${slug}`);
    const s = data.data?.service;
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      slug: s.sku,
      seller: s.seller?.store_name || s.seller?.full_name || "Geoinformaticx",
      location: s.seller?.location || null,
      price: Number(s.price || 0),
      category: s.category,
      description: s.description || "No description provided.",
      img: s.image_url || "https://placehold.co/600x400?text=No+Image",
    };
  } catch (err) {
    console.error("Failed to load service:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service Not Found | Geoinformaticx" };
  return {
    title: `${service.name} | Geoinformaticx`,
    description: service.description,
  };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}