import type { Metadata } from "next";
import CompanyEditClient from "./CompanyEditClient";

export const metadata: Metadata = {
  title: "Edit Company | Vendor Booking Tool",
  description: "Update company information",
};

export default function CompanyEditPage() {
  return <CompanyEditClient />;
}


