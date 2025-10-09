import React, { useEffect, useState } from "react";
import { StatsCard } from "../../../components/Cards/StatsCard";
import { RecentActivity, ActivityLog } from "../../../components/Cards/RecentActivity";
import { BookOpen, Calendar, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { useAuth } from "../../../contexts/AuthContext";
import { CourseCard } from "../../../components/courses/CourseCard";
import { useCourses, EnrollmentCourse } from "../../../hooks/useCourses";
import { Course } from "../../../types";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export const TrainerOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const { allCourses, loading } = useCourses(currentUser);

  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    courses: 0,
    activeSessions: 0,
    totalStudents: 0,
    completionRate: 0,
  });

  const [uniqueStudents, setUniqueStudents] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Filter trainer's courses
    const trainerCourses = allCourses.filter(
      (course) => String(course.instructorId) === currentUser.uid
    );
    setMyCourses(trainerCourses);

    // Active sessions
    const activeSessions = trainerCourses.filter((c) => c.status === "active").length;

    // Completion rate
    const completedCourses = trainerCourses.filter((c) => c.status === "completed").length;
    const completionRate = trainerCourses.length
      ? +((completedCourses / trainerCourses.length) * 100).toFixed(1)
      : 0;

    setStats((prev) => ({
      ...prev,
      courses: trainerCourses.length,
      activeSessions,
      completionRate,
    }));

    // Fetch enrollments for trainer's courses
    if (trainerCourses.length === 0) return;

    const courseIds = trainerCourses.map((c) => c.id);
    const enrollmentCol = collection(db, "enrollments");
    const q = query(enrollmentCol, where("courses", "!=", [])); // Firestore array check

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsSet = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data() as { courses: EnrollmentCourse[]; userId: string };
        if (data.courses) {
          data.courses.forEach((enrolledCourse) => {
            if (courseIds.includes(enrolledCourse.courseId)) {
              studentsSet.add(data.userId);
            }
          });
        }
      });

      setUniqueStudents(studentsSet);
      setStats((prev) => ({ ...prev, totalStudents: studentsSet.size }));
    });

    return () => unsubscribe();
  }, [allCourses, currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "activityLogs"),
      where("trainerId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities: ActivityLog[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || currentUser.displayName || "Trainer",
          action: data.action || "",
          target: data.target || "",
          details: data.details || "",
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      });
      setRecentActivities(activities);
      setLoadingActivities(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trainer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {currentUser?.displayName || "Trainer"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="My Courses" value={stats.courses.toString()} icon={BookOpen} color="blue" />
        <StatsCard title="Active Sessions" value={stats.activeSessions.toString()} icon={Calendar} color="green" />
        <StatsCard title="Total Students" value={stats.totalStudents.toString()} icon={Users} color="yellow" />
        <StatsCard title="Completion Rate" value={`${stats.completionRate}%`} icon={TrendingUp} color="purple" />
      </div>

      {/* Courses and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Courses
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
                      </div>
                    ))
                  : myCourses.length === 0
                  ? (
                      <div className="col-span-2 text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          You haven't created any courses yet.
                        </p>
                      </div>
                    )
                  : myCourses
                      .sort((a, b) => new Date(b.startDate || "").getTime() - new Date(a.startDate || "").getTime())
                      .slice(0, 4)
                      .map((course) => <CourseCard key={course.id} course={course} />)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <RecentActivity logs={recentActivities} loading={loadingActivities} limitCount={5} />
        </div>
      </div>
    </div>
  );
};
