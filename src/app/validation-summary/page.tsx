import ValidationSummaryManager from "@/components/shared/operations/ValidationSummaryManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validation Summary",
  description: "View validation summary for shipment uploads",
};

export default function ValidationSummaryPage() {
  return <ValidationSummaryManager />;
}