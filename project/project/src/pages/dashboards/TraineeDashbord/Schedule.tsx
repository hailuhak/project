import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Calendar } from "lucide-react";
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

  useEffect(() => {
    if (!currentUser) return;

    const enrollmentRef = collection(db, "enrollments");
    const q = query(enrollmentRef, where("userId", "==", currentUser.uid));

    const unsubscribeEnrollments = onSnapshot(q, (enrollmentSnap) => {
      const courseIds: string[] = [];
      enrollmentSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.courseIds && Array.isArray(data.courseIds)) {
          courseIds.push(...data.courseIds);
        } else if (data.courseId) {
          courseIds.push(data.courseId);
        }
      });

      if (courseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const sessionsRef = collection(db, "trainingSessions");
      const batches: string[][] = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        batches.push(courseIds.slice(i, i + 10));
      }

      const unsubscribes = batches.map((batchIds) => {
        const sessionsQuery = query(sessionsRef, where("courseId", "in", batchIds));
        return onSnapshot(sessionsQuery, (sessionsSnap) => {
          const allSessions: TrainingSession[] = sessionsSnap.docs.map((doc) => {
            const data = doc.data() as DocumentData;
            let sessionDate: Date;

            if (data.date?.toDate) {
              sessionDate = data.date.toDate();
            } else {
              sessionDate = new Date(data.date);
            }

            return {
              id: doc.id,
              courseId: data.courseId,
              courseName: data.courseName,
              date: sessionDate,
              hours: data.hours || 0,
            };
          });

          const now = new Date();
          const upcoming = allSessions
            .filter((s) => {
              const start = s.date.getTime();
              const end = start + s.hours * 60 * 60 * 1000;
              return end >= now.getTime();
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          setSessions(upcoming);
          setLoading(false);
        });
      });

      return () => unsubscribes.forEach((unsub) => unsub());
    });

    return () => unsubscribeEnrollments();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View upcoming sessions and deadlines
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading schedule...</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No upcoming sessions found.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        sessions.map((session) => (
          <Card key={session.id}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {session.courseName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {session.date.toLocaleString()} – {session.hours} hrs
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
