import AssignmentResultsManager from "@/components/shared/operations/AssignmentResultsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assignment Results | Vendor Booking Tool",
  description: "View assignment results",
};

const AdminAssignmentResultsPage = () => {
  return <AssignmentResultsManager />;
};

export default AdminAssignmentResultsPage;