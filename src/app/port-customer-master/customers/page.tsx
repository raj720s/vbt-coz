import type { Metadata } from "next";
import { CustomerManager } from "@/components/shared/master-data";

export const metadata: Metadata = {
  title: "Customer Records | Vendor Booking Tool",
  description: "Manage customer information and contact details",
};

export default function CustomersPage() {
  return <CustomerManager />;
}