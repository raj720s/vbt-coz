import type { Metadata } from "next";
import UserDashboardClient from "./UserDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Vendor Booking Tool",
  description: "System overview and operational metrics for users",
};

function UserDashboard() {
  return <UserDashboardClient />;
}

export default UserDashboard;