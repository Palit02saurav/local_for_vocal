import { getBusinessBySlug } from "@/lib/businesses";
import BusinessDetail from "./business";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) return { title: "Business Not Found | Geoinformaticx" };
  return {
    title: `${business.name} | Geoinformaticx`,
    description: business.description,
  };
}

export default async function BusinessPage({ params }) {
  const { slug } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) notFound();
  return <BusinessDetail business={business} />;
}