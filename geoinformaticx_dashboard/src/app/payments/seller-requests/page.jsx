import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Seller Payout Requests | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="product"
      requestsOnly
      title="Seller Payout Requests"
      subtitle="Review and verify bank details submitted by sellers."
    />
  );
}