import type { Metadata } from "next";
import CustomerEditClient from "../edit/CustomerEditClient";

export const metadata: Metadata = {
  title: "Add Customer | Vendor Booking Tool",
  description: "Create a new customer",
};

export default function CustomerAddPage() {
  return <CustomerEditClient />;
}

