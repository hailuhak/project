import React from "react";
import { TrainerOverview } from "./TrainerOverview";
import { TrainerCourses } from "./TrainerCourses";
import { TrainingSessions } from "./TrainingSessions";
import { Attendance } from "./Attendance";
import { TrainingMaterials } from "./TrainingMaterials";

interface TrainerDashboardProps {
  activeSection: string;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ activeSection }) => {
  switch (activeSection) {
    case "courses":
      return <TrainerCourses />;


    case "sessions":
      return <TrainingSessions />;

    case "attendance":
      return <Attendance />;

    case "materials":
      return <TrainingMaterials />;

    default:
      return <TrainerOverview />;
  }
};
