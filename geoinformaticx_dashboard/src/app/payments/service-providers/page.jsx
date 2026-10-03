import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Service Provider Bank Accounts | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="service"
      title="All Service Providers Bank Accounts"
      subtitle="Bank details submitted by service providers."
    />
  );
}