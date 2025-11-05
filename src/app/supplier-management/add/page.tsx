import type { Metadata } from "next";
import SupplierEditClient from "../edit/SupplierEditClient";

export const metadata: Metadata = {
  title: "Add Supplier | Vendor Booking Tool",
  description: "Create a new supplier",
};

export default function SupplierAddPage() {
  return <SupplierEditClient />;
}

