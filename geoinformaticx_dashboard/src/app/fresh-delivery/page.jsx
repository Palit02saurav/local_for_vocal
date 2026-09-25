import Products from "../products/products";

export const metadata = {
  title: "Fresh Delivery | Geoinformaticx",
};

export default function FreshDeliveryPage() {
  return (
    <Products
      deliveryType="Fresh"
      title="Fresh Delivery"
      subtitle="Products you offer for 10-minute delivery."
    />
  );
}