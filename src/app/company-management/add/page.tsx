import type { Metadata } from "next";
import CompanyEditClient from "../edit/CompanyEditClient";

export const metadata: Metadata = {
  title: "Add Company | Vendor Booking Tool",
  description: "Create a new company",
};

export default function CompanyAddPage() {
  return <CompanyEditClient />;
}


