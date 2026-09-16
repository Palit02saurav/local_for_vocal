import ProductRequests from "../requests/requests";

export const metadata = {
  title: "Regional Famous Product Requests | Geoinformaticx Admin",
};

export default function RegionalProductRequestsPage() {
  return (
    <ProductRequests
      productType="Regional Famous"
      title="Regional Famous Products Requests"
      subtitle="Review and approve region-specific famous products submitted by sellers."
    />
  );
}