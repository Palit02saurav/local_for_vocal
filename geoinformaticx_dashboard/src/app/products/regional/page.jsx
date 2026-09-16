import Products from "../products";

export const metadata = {
  title: "Regional Famous Products | Geoinformaticx Admin",
};

export default function RegionalProductsPage() {
  return (
    <Products
      productType="Regional Famous"
      title="Regional Famous Products"
      subtitle="Products marked as a region's specific famous product."
    />
  );
}