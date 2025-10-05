import React, { useState, useMemo } from "react";
import { Button } from "../../../components/ui/Button";
import { BookOpen, Search } from "lucide-react";
import { CourseCard } from "../../../components/courses/CourseCard";
import { User, Course } from "../../../types";
import { useCourses } from "../../../hooks/useCourses";

interface MyCoursesProps {
  currentUser?: User | null;
}

export const MyCourses: React.FC<MyCoursesProps> = ({ currentUser }) => {
  if (!currentUser) return <p>Loading user data...</p>;

  const { allCourses, enrollments, enrollCourse, unenrollCourse } = useCourses(currentUser);

  const [showAllCourses, setShowAllCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Compute enrolled course IDs
  const enrolledCourseIds = useMemo(
    () => enrollments?.courses.map((c) => c.courseId) || [],
    [enrollments]
  );

  // Enrolled courses with full info
  const enrolledCourses: (Course & { enrolledAt?: string })[] = useMemo(() => {
    return enrolledCourseIds
      .map((id) => {
        const course = allCourses.find((c) => c.id === id);
        if (!course) return null;
        const enrollmentInfo = enrollments?.courses.find((e) => e.courseId === id);
        return { ...course, enrolledAt: enrollmentInfo?.enrolledAt };
      })
      .filter(Boolean) as (Course & { enrolledAt?: string })[];
  }, [enrolledCourseIds, allCourses, enrollments]);

  // Available courses
  const availableCoursesBase: Course[] = allCourses.filter((c) => !enrolledCourseIds.includes(c.id));

  const availableCourses: Course[] = useMemo(() => {
    let filtered = availableCoursesBase;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((course) => course.status === statusFilter);
    }

    return filtered;
  }, [availableCoursesBase, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableCoursesBase.forEach((c) => {
      const status = c.status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [availableCoursesBase]);

  const uniqueStatuses = useMemo(() => ["all", ...Object.keys(statusCounts)], [statusCounts]);

  const groupedCourses: Record<string, Course[]> = useMemo(() => {
    return availableCourses.reduce((acc, course) => {
      const status = course.status || "Unknown";
      if (!acc[status]) acc[status] = [];
      acc[status].push(course);
      return acc;
    }, {} as Record<string, Course[]>);
  }, [availableCourses]);

  const showFeedback = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEnroll = async (course: Course) => {
    if (course.status !== "active") return;

    try {
      await enrollCourse(course.id);
      showFeedback(`Successfully enrolled in "${course.title}"!`);
    } catch (error: any) {
      showFeedback(error?.message || "Enrollment failed.");
    }
  };

  const handleUnenroll = async (course: Course) => {
    try {
      await unenrollCourse(course.id);
      showFeedback(`You have unenrolled from "${course.title}"`);
    } catch (error: any) {
      showFeedback(error?.message || "Unenroll failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div
          className={`fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-700 ${
            showSuccess ? "opacity-100" : "opacity-0"
          }`}
        >
          {successMessage}
        </div>
      )}

      {/* Enrolled Courses */}
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            My Enrolled Courses
          </h1>
          <Button onClick={() => setShowAllCourses(!showAllCourses)} size="sm">
            <BookOpen className="w-4 h-4 mr-1" />
            {showAllCourses ? "Hide Courses" : "Browse More Courses"}
          </Button>
        </div>

        {enrolledCourses.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-6">
            You are not enrolled in any courses yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col justify-between h-auto rounded-lg shadow p-4 bg-white dark:bg-gray-800"
              >
                <CourseCard course={course} showActions={false} className="h-40" />
                <Button size="sm" className="mt-2 w-full" onClick={() => handleUnenroll(course)}>
                  Unenroll
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Browse All Courses */}
      {showAllCourses && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Courses
          </h2>

          {/* Search & Filter */}
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div className="flex items-center w-full sm:w-2/3">
              <Search className="w-5 h-5 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div className="w-full sm:w-1/3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Statuses"
                      : `${status.charAt(0).toUpperCase() + status.slice(1)} (${statusCounts[status]})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {availableCourses.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No courses match your filters.</p>
          ) : (
            Object.keys(groupedCourses).map((status) => (
              <div key={status} className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {status.charAt(0).toUpperCase() + status.slice(1)} Courses
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedCourses[status].map((course) => {
                    const isDisabled = course.status !== "active";
                    return (
                      <div
                        key={course.id}
                        className={`flex flex-col justify-between h-auto rounded-lg shadow p-4 ${
                          isDisabled
                            ? "bg-gray-200 dark:bg-gray-700 opacity-70"
                            : "bg-white dark:bg-gray-800"
                        }`}
                      >
                        <CourseCard course={course} showActions={false} className="h-48" />
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleEnroll(course)}
                          disabled={isDisabled}
                        >
                          {isDisabled ? "Unavailable" : "Enroll Now"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
