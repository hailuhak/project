import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, Award } from "lucide-react";
import { StatsCard } from "../../../components/Cards/StatsCard";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { User, Course } from "../../../types";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface DashboardOverviewProps {
  currentUser: User | null;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ currentUser }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainersCount, setTrainersCount] = useState(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // 🔄 real-time courses
    const unsubscribeCourses = onSnapshot(collection(db, "courses"), (snapshot) => {
      const fetchedCourses: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(fetchedCourses);
      setLoading(false);

      // calculate success rate from courses
      const completed = fetchedCourses.filter((c) => c.status === "completed").length;
      const active = fetchedCourses.filter((c) => c.status === "active").length;
      const total = completed + active;

      if (total > 0) {
        setSuccessRate(Math.round((completed / total) * 100));
      } else {
        setSuccessRate(null);
      }
    });

    // 🔄 real-time trainers
    const trainersQuery = query(collection(db, "users"), where("role", "==", "trainer"));
    const unsubscribeTrainers = onSnapshot(trainersQuery, (snapshot) => {
      setTrainersCount(snapshot.size);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeTrainers();
    };
  }, []);

  const isApproved = currentUser?.status === "approved"; // adjust to your schema
  const visibleCourses = showAll ? courses : courses.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {currentUser?.displayName?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-blue-100 text-lg">
          Discover audit training courses to advance your career
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="All Courses"
          value={courses.length.toString()}
          changeType="neutral"
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Expert Trainers"
          value={trainersCount.toString()}
          
          changeType="neutral"
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Success Rate"
          value={successRate !== null ? `${successRate}%` : "—"}
          changeType="increase"
          icon={Award}
          color="yellow"
        />
      </div>

      {/* Featured Courses */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Featured Courses
          </h3>
          {courses.length > 3 && (
            <Button variant="outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Less" : "View All Courses"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showActions={isApproved} // hide enroll/view if not approved
                  onEnroll={() => console.log("Enroll in:", course.title)}
                  onView={() => console.log("View details:", course.title)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
