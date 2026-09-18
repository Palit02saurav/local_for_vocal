import StoreDetail from "./store";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `Store | Geoinformaticx`,
  };
}

export default async function StorePage({ params }) {
  const { slug } = await params;
  return <StoreDetail sellerId={slug} />;
}