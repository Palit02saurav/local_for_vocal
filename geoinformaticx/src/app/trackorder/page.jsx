import { Suspense } from "react";
import TrackOrder from "./trackorder";

export const metadata = {
  title: "Track Order | Geoinformaticx",
  description: "Track your product orders.",
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrder />
    </Suspense>
  );
}