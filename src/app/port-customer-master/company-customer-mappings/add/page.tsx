import type { Metadata } from "next";
import CompanyCustomerMappingEditClient from "../edit/CompanyCustomerMappingEditClient";

export const metadata: Metadata = {
  title: "Add Company Customer Mapping | Vendor Booking Tool",
  description: "Create a new company customer mapping",
};

export default function CompanyCustomerMappingAddPage() {
  return <CompanyCustomerMappingEditClient />;
}

