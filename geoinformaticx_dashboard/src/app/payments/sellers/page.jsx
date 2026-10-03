import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Seller Bank Accounts | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="product"
      title="All Sellers Bank Accounts"
      subtitle="Bank details submitted by product sellers."
    />
  );
}