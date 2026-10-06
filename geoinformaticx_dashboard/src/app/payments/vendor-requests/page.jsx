import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Street Vendor Payout Requests | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="vendor"
      requestsOnly
      title="Street Vendor Payout Requests"
      subtitle="Review and verify bank details submitted by street vendors."
    />
  );
}