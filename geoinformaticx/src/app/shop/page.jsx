import { Suspense } from "react";
import Shop from "./shop";

export const metadata = {
  title: "Shop | Geomaticx",
  description:
    "Discover unique local products from trusted businesses in your area.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <Shop />
    </Suspense>
  );
}