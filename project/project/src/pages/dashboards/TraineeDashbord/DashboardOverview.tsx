import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { RecentActivity } from "../../../components/Cards/RecentActivity";
import { CourseCard } from "../../../components/courses/CourseCard";
import { User, Course } from "../../../types";
import { useCourses } from "../../../hooks/useCourses";

interface DashboardOverviewProps {
  currentUser: User;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ currentUser }) => {
  const { allCourses, enrolledCourseIds, enrollCourse, recentCourses } = useCourses(currentUser);

  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Filter available courses to enroll
  const availableCourses: Course[] = allCourses.filter(
    (course) => !enrolledCourseIds.includes(course.id) && course.status === "active"
  );

  // Handle enrollment
  const handleEnroll = async () => {
    if (!selectedCourse) return;

    try {
      await enrollCourse(selectedCourse);
      setSuccessMessage("Successfully enrolled!");
      setShowSuccess(true);
      setShowForm(false);
      setSelectedCourse("");
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      setSuccessMessage(error?.message || "Failed to enroll. Try again.");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Welcome back, {currentUser?.displayName?.split(" ")[0] || "Student"}!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Continue your audit training journey
      </p>

      {/* Success Notification */}
      {successMessage && (
        <div
          className={`fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-700 ${
            showSuccess ? "opacity-100" : "opacity-0"
          }`}
        >
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Courses
                </h3>
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentCourses.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 col-span-full text-center">
                    You are not enrolled in any courses yet.
                  </p>
                ) : (
                  recentCourses.map((course) => (
                    <CourseCard
                      key={course.id} // ✅ Unique key for each course
                      course={course}
                      showActions={false}
                      onView={() => console.log("View course:", course.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Enrollment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-96 p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Enroll in a Course
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                value={currentUser.displayName}
                readOnly
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600
                  bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={currentUser.uid}
                readOnly
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600
                  bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600
                  bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-60 overflow-y-auto"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Select an active course</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title || "-"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={!selectedCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
