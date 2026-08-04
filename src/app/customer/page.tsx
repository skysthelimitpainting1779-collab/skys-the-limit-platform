import type { Metadata } from "next";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";

export const metadata: Metadata = {
  title: "Customer Portal | Sky's the Limit Painting",
  description: "Access your painting project estimates, timelines, color choices, and invoices.",
};

export default function CustomerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl">
          Your project record
        </h1>
        <p className="mt-3 max-w-[70ch] text-base leading-7 text-muted-foreground">
          Estimates, scheduled work, property details, and customer-visible
          updates are shown only when this WorkOS identity is explicitly linked
          to the customer account.
        </p>
      </header>

      <CustomerDashboard />
    </main>
  );
}

