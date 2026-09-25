import ProductRequests from "../requests/requests";

export const metadata = {
  title: "Fresh Delivery Requests | Geoinformaticx Admin",
};

export default function FreshRequestsPage() {
  return (
    <ProductRequests
      deliveryType="Fresh"
      title="Fresh Delivery Requests"
      subtitle="Review and approve 10-minute delivery products submitted by sellers."
    />
  );
}