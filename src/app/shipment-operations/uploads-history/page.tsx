import { Metadata } from "next";
import UploadsHistoryManager from "@/components/shared/common/UploadHistoryManager";

export const metadata: Metadata = {
  title: "Uploads History",
  description: "View uploads history",
};

export default function UploadsHistoryPage() {
  return <UploadsHistoryManager />;
}