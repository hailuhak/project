import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { MyCourses } from "./MyCourses";
import { Progress } from "./Progress";
import { Schedule } from "./Schedule";
import { Resources } from "./Resources";
import { DashboardOverview } from "./DashboardOverview";

interface TraineeDashboardProps {
  activeSection: string;
}

export const TraineeDashboard: React.FC<TraineeDashboardProps> = ({
  activeSection,
}) => {
  const { currentUser } = useAuth();

  // Handle null user early
  if (!currentUser) {
    return (
      <div className="p-4 text-center text-gray-600 dark:text-gray-300">
        Please log in to view your dashboard.
      </div>
    );
  }

  switch (activeSection) {
    case "courses":
      return <MyCourses currentUser={currentUser} />;
    case "progress":
      return <Progress currentUser={currentUser} />;
    case "schedule":
      return <Schedule />;
    case "resources":
      return <Resources />;
    default:
      return <DashboardOverview currentUser={currentUser} />;
  }
};
