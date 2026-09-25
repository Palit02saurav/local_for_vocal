import Categories from "../Categories";

export const metadata = {
  title: "Fresh Delivery Categories | Geoinformaticx Admin",
};

export default function FreshCategoriesPage() {
  return (
    <Categories
      type="fresh"
      title="Fresh Delivery Categories"
      subtitle="Categories sellers can choose from when adding 10-minute delivery products."
      addHref="/categories/new-fresh"
      addLabel="+ Add Fresh Delivery Category"
    />
  );
}