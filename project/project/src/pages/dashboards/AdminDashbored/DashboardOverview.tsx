import React, { useEffect, useState } from "react";
import { StatsCard } from "../../../components/Cards/StatsCard";
import { CourseCard } from "../../../components/courses/CourseCard";
import { RecentActivity } from "../../../components/Cards/RecentActivity";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Users, BookOpen, TrendingUp, Activity } from "lucide-react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Course, ActivityLog } from "../../../types";

export const DashboardOverview: React.FC = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    // Users count listener
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsersCount(snapshot.size);
    });

    // Courses listener
    const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const formattedCourses = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          title: data.title,
          instructorId: data.instructorId,
          instructorName: data.instructorName,
          hours: data.duration || 0,
          level: data.level || "beginner",
          category: data.category || "",
          startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(),
          materials: data.materials || [],
          status: data.status || "active",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as Course;
      });
      setCourses(formattedCourses);
      setCoursesLoading(false);
    });

    // Activity logs listener
    const logsQuery = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const activityData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || 'Unknown',
          userId: data.userId || '',
          userRole: data.userRole || 'trainee',
          trainerId: data.trainerId,
          action: data.action || '',
          target: data.target || '',
          details: data.details || '',
          timestamp: data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp),
        } as ActivityLog;
      });
      setLogs(activityData.slice(0, 3)); // only take 3 most recent
      setLogsLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCourses();
      unsubscribeLogs();
    };
  }, []);

  // Derived stats
  const completionRate = courses.length
    ? Math.round((courses.filter((c) => c.status === "completed").length / courses.length) * 100)
    : 0;

  const monthlySessions = courses.filter(
    (c) => c.startDate.getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Home Page</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your audit training system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Users" value={usersCount.toString()} icon={Users} color="blue" />
        <StatsCard title="Active Courses" value={courses.length.toString()} icon={BookOpen} color="green" />
        <StatsCard title="Completion Rate" value={`${completionRate}%`} icon={TrendingUp} color="yellow" />
        <StatsCard title="Monthly Sessions" value={monthlySessions.toString()} icon={Activity} color="purple" />
      </div>

      {/* Recent Courses & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showAllCourses ? "All Courses" : "Recent Courses"}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowAllCourses((prev) => !prev)}>
                  {showAllCourses ? "Show Less" : "View All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coursesLoading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
                      </div>
                    ))
                  : (showAllCourses ? courses : courses.slice(0, 4)).map((course) => (
                      <CourseCard key={course.id} course={course} showActions={false} />
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <RecentActivity logs={logs} loading={logsLoading} />
        </div>
      </div>
    </div>
  );
};
