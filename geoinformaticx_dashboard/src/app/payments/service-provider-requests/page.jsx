import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Service Provider Payout Requests | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="service"
      requestsOnly
      title="Service Provider Payout Requests"
      subtitle="Review and verify bank details submitted by service providers."
    />
  );
}