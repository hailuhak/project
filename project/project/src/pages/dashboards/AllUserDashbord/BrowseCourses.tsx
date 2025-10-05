import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Input } from "../../../components/ui/Input";
import { Card, CardContent } from "../../../components/ui/Card";
import { User, Course } from "../../../types";

interface BrowseCoursesProps {
  currentUser: User | null;
}

export const BrowseCourses: React.FC<BrowseCoursesProps> = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");

  // Fetch courses from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const fetchedCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(fetchedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Extract unique categories & levels
  const categories = useMemo(() => {
    const unique = new Set(courses.map((c) => c.category).filter(Boolean));
    return ["All Courses", ...unique];
  }, [courses]);

  const levels = useMemo(() => {
    const unique = new Set(courses.map((c) => c.level).filter(Boolean));
    return ["All Levels", ...unique];
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const title = course.title?.toLowerCase() || "";
      const description = course.description?.toLowerCase() || "";
      const instructor = course.instructorName?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        title.includes(query) ||
        description.includes(query) ||
        instructor.includes(query);

      const matchesCategory =
        selectedCategory === "All Courses" ||
        course.category === selectedCategory;

      const matchesLevel =
        selectedLevel === "All Levels" || course.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchTerm, selectedCategory, selectedLevel]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          Browse Courses
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Find the right course for you — updated in real time
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="shadow-md border border-gray-200 dark:border-gray-700 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 w-full">
            {/* Search Bar (fills left space) */}
            <div className="flex-1">
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters aligned right */}
            <div className="flex gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {levels.map((lvl) => (
                  <option key={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading courses...</p>
      ) : filteredCourses.length === 0 ? (
        <p className="text-gray-500 text-center">No courses found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );
};
