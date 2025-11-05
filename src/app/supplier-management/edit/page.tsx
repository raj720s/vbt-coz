import type { Metadata } from "next";
import SupplierEditClient from "./SupplierEditClient";

export const metadata: Metadata = {
  title: "Edit Supplier | Vendor Booking Tool",
  description: "Update supplier information",
};

export default function SupplierEditPage() {
  return <SupplierEditClient />;
}

