import React, { useMemo } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { useCourses } from "../../../hooks/useCourses";
import { useUserProgress } from "../../../hooks/useUserProgress";
import { User, Course } from "../../../types";

interface ProgressProps {
  currentUser: User;
}

type EnrolledCourse = Omit<Course, "enrolledAt" | "status"> & {
  enrolledAt?: Date;
  status?: "active" | "draft" | "completed" | "cancelled";
};

export const Progress: React.FC<ProgressProps> = ({ currentUser }) => {
  const { enrollments, allCourses } = useCourses(currentUser);
  const { videoHours, documentHours, attendanceHours } = useUserProgress(currentUser);

  // ✅ Build enriched list (only enrolled courses, ignore drafts)
  const enrolledCourses: EnrolledCourse[] = useMemo(() => {
    if (!enrollments?.courses) return [];

    return enrollments.courses
      .map((enrollment) => {
        const course = allCourses.find((c) => c.id === enrollment.courseId);
        if (!course) return null;

        return {
          ...course,
          enrolledAt: enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : undefined,
          status: enrollment.status || course.status,
        } as EnrolledCourse;
      })
      .filter((c): c is EnrolledCourse => !!c && c.status !== "draft");
  }, [enrollments, allCourses]);

  // ✅ Compute stats (no double counting)
  const stats = useMemo(() => {
    const completedCount = enrolledCourses.filter((c) => c.status === "completed").length;
    const activeCount = enrolledCourses.filter((c) => c.status === "active").length;

    // Activity-based progress (real-time)
    const activityHours =
      (videoHours ?? 0) + (documentHours ?? 0) + (attendanceHours ?? 0);

    // Count hours: completed courses → take course.hours, active courses → track activity
    const hoursLearned = enrolledCourses.reduce((sum, course) => {
      if (course.status === "completed") {
        return sum + (course.hours ?? 0);
      } else if (course.status === "active") {
        return sum + activityHours;
      }
      return sum;
    }, 0);

    const totalHours = enrolledCourses.reduce((sum, c) => sum + (c.hours ?? 0), 0);
    const totalCourses = enrolledCourses.length;

    return [
      {
        label: "Courses Completed",
        value: completedCount,
        total: totalCourses,
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      },
      {
        label: "Hours Learned",
        value: hoursLearned,
        total: totalHours,
        icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
      },
      {
        label: "Active Courses",
        value: activeCount,
        total: totalCourses,
        icon: <BookOpen className="w-6 h-6 text-yellow-500" />,
      },
    ];
  }, [enrolledCourses, videoHours, documentHours, attendanceHours]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your learning achievements and milestones
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const percentage =
            stat.total > 0 ? Math.min(100, Math.round((stat.value / stat.total) * 100)) : 0;

          return (
            <Card
              key={stat.label}
              className="bg-gray-50 dark:bg-gray-800 shadow-md rounded-lg"
            >
              <CardContent>
                <div className="flex items-center mb-3">
                  {stat.icon}
                  <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                    {stat.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.value} / {stat.total} ({percentage}%)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
