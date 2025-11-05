import type { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Vendor Booking Tool",
  description: "System overview and operational metrics for administrators",
};

function AdminDashboard() {
  return <AdminDashboardClient />;
}

export default AdminDashboard;