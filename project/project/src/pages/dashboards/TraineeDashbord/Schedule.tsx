import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Calendar, Filter } from "lucide-react";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

interface TrainingSession {
  id: string;
  courseId: string;
  courseName: string;
  date: Date;
  hours: number;
}

export const Schedule: React.FC = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    if (!currentUser) return;

    // Listen to enrollments for current user in real-time
    const enrollmentRef = collection(db, "enrollments");
    const enrollmentQuery = query(enrollmentRef, where("userId", "==", currentUser.uid));

    const unsubscribeEnrollments = onSnapshot(enrollmentQuery, (enrollmentSnap) => {
      const courseIds: string[] = [];

      enrollmentSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.courses && Array.isArray(data.courses)) {
          data.courses.forEach((c: any) => {
            if (c.courseId) courseIds.push(c.courseId);
          });
        }
      });

      if (courseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Listen to all relevant training sessions in real-time
      const sessionsRef = collection(db, "trainingSessions");
      const batches: string[][] = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        batches.push(courseIds.slice(i, i + 10));
      }

      const unsubscribes: (() => void)[] = [];
      const allSessions: TrainingSession[] = [];

      batches.forEach((batchIds) => {
        const sessionsQuery = query(sessionsRef, where("courseId", "in", batchIds));

        const unsub = onSnapshot(sessionsQuery, (snap) => {
          snap.docChanges().forEach((change) => {
            const data = change.doc.data() as DocumentData;
            const sessionDate: Date = data.date?.toDate
              ? data.date.toDate()
              : new Date(data.date);

            const sessionObj: TrainingSession = {
              id: change.doc.id,
              courseId: data.courseId,
              courseName: data.courseName,
              date: sessionDate,
              hours: data.hours || 0,
            };

            if (change.type === "added") {
              allSessions.push(sessionObj);
            } else if (change.type === "modified") {
              const index = allSessions.findIndex((s) => s.id === change.doc.id);
              if (index > -1) allSessions[index] = sessionObj;
            } else if (change.type === "removed") {
              const index = allSessions.findIndex((s) => s.id === change.doc.id);
              if (index > -1) allSessions.splice(index, 1);
            }
          });

          // Sort sessions by date
          const sorted = allSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
          setSessions([...sorted]);
          setLoading(false);
        });

        unsubscribes.push(unsub);
      });

      return () => unsubscribes.forEach((unsub) => unsub());
    });

    return () => unsubscribeEnrollments();
  }, [currentUser]);

  const filteredSessions = sessions.filter((s) => {
    const now = new Date();
    const endTime = s.date.getTime() + s.hours * 3600 * 1000;

    if (filter === "upcoming") return endTime >= now.getTime();
    if (filter === "completed") return endTime < now.getTime();
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and filter your training sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Sessions</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading schedule...</p>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No sessions found for this filter.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Course Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredSessions.map((session, index) => {
                const now = new Date();
                const endTime = session.date.getTime() + session.hours * 3600 * 1000;
                const status =
                  endTime < now.getTime()
                    ? "Completed"
                    : session.date > now
                    ? "Upcoming"
                    : "Ongoing";

                return (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{session.courseName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{session.date.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{session.hours}</td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold ${
                        status === "Completed"
                          ? "text-green-500"
                          : status === "Upcoming"
                          ? "text-blue-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
