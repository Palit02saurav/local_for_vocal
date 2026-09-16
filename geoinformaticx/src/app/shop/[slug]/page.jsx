import ProductDetail from "./product";

export default async function ProductPage({ params }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}