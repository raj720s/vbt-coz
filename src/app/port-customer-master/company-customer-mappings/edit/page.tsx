import type { Metadata } from "next";
import CompanyCustomerMappingEditClient from "./CompanyCustomerMappingEditClient";

export const metadata: Metadata = {
  title: "Edit Company Customer Mapping | Vendor Booking Tool",
  description: "Update company customer mapping information",
};

export default function CompanyCustomerMappingEditPage() {
  return <CompanyCustomerMappingEditClient />;
}

