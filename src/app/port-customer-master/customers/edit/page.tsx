import type { Metadata } from "next";
import CustomerEditClient from "./CustomerEditClient";

export const metadata: Metadata = {
  title: "Edit Customer | Vendor Booking Tool",
  description: "Update customer information",
};

export default function CustomerEditPage() {
  return <CustomerEditClient />;
}

