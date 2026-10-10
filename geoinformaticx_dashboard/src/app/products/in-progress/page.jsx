import Products from "../products";

export const metadata = {
  title: "In Progress | Geomaticx",
};

export default function InProgressProductsPage() {
  return (
    <Products
      approvalStatus="Pending"
      title="In Progress"
      subtitle="Products you've submitted that are waiting for admin approval."
    />
  );
}