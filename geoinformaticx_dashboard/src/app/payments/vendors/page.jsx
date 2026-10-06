import PayoutAccounts from "../PayoutAccounts";

export const metadata = { title: "Street Vendor Bank Accounts | Geoinformaticx Admin" };

export default function Page() {
  return (
    <PayoutAccounts
      sellerType="vendor"
      title="All Street Vendors Bank Accounts"
      subtitle="Bank details submitted by street vendors."
    />
  );
}