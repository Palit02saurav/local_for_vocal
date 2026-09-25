import Products from "../../products/products";

export const metadata = {
  title: "Fresh Delivery - In Progress | Geoinformaticx",
};

export default function FreshInProgressPage() {
  return (
    <Products
      deliveryType="Fresh"
      approvalStatus="Pending"
      title="Fresh Delivery - In Progress"
      subtitle="Fresh products you've submitted that are waiting for admin approval."
    />
  );
}