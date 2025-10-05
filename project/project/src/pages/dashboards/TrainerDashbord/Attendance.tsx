import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { CheckSquare } from "lucide-react";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { AttendanceRecord, TrainingSession } from "../../../types";

interface AttendanceProps {
  sessionId?: string; // Optional: preselected session
}

export const Attendance: React.FC<AttendanceProps> = ({ sessionId: propSessionId }) => {
  const { currentUser } = useAuth();

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(propSessionId || "");
  const [sessionDate, setSessionDate] = useState<Date | null>(null);

  const [trainees, setTrainees] = useState<{ id: string; name: string; email: string }[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 🔹 1) Fetch sessions for the current trainer
   */
  useEffect(() => {
    if (!currentUser) return;

    const fetchSessions = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "trainingSessions"), where("trainerId", "==", currentUser.uid))
        );

        const list: TrainingSession[] = snap.docs.map((d) => ({
          ...(d.data() as TrainingSession),
          id: d.id,
        }));

        setSessions(list);
      } catch (err) {
        console.error("❌ Error fetching sessions:", err);
      }
    };

    fetchSessions();
  }, [currentUser]);

  /**
   * 🔹 2) When a session is selected, fetch its details + trainees
   */
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchSessionAndTrainees = async () => {
      setLoading(true);
      try {
        // a) Load session
        const sessionSnap = await getDocs(
          query(collection(db, "trainingSessions"), where("__name__", "==", selectedSessionId))
        );

        let sessionData: TrainingSession | undefined;
        sessionSnap.forEach((d) => {
          sessionData = { ...(d.data() as TrainingSession), id: d.id };
        });

        if (!sessionData) {
          console.warn("⚠️ No session found for ID:", selectedSessionId);
          setTrainees([]);
          return;
        }

        // b) Save session date
        if (sessionData.date) {
          setSessionDate(
            sessionData.date instanceof Timestamp
              ? sessionData.date.toDate()
              : (sessionData.date as Date)
          );
        }

        // c) Fetch trainees using courseId → enrollments (using `courseIds` array)
        if (sessionData.courseId) {
          const enrollmentSnap = await getDocs(
            query(
              collection(db, "enrollments"),
              where("courseIds", "array-contains", sessionData.courseId)
            )
          );

          const userIds = enrollmentSnap.docs.map((d) => d.data().userId);

          if (userIds.length > 0) {
            // Firestore "in" only supports up to 10 IDs, so batch if needed
            const batchSize = 10;
            const usersList: any[] = [];

            for (let i = 0; i < userIds.length; i += batchSize) {
              const batchIds = userIds.slice(i, i + batchSize);
              const usersSnap = await getDocs(
                query(collection(db, "users"), where("__name__", "in", batchIds))
              );

              usersSnap.docs.forEach((d) =>
                usersList.push({
                  id: d.id,
                  name: d.data().displayName || d.data().name || "Unknown",
                  email: d.data().email || "N/A",
                })
              );
            }

            setTrainees(usersList);

            // d) Ensure attendance records exist
            for (const trainee of usersList) {
              const attQuery = query(
                collection(db, "attendance"),
                where("sessionId", "==", selectedSessionId),
                where("studentId", "==", trainee.id)
              );

              const attSnap = await getDocs(attQuery);

              if (attSnap.empty) {
                const newRef = doc(collection(db, "attendance"));
                await setDoc(newRef, {
                  sessionId: selectedSessionId,
                  studentId: trainee.id,
                  studentName: trainee.name,
                  status: "absent",
                  timestamp: serverTimestamp(),
                });
              }
            }
          } else {
            setTrainees([]);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching session/trainees:", err);
        setTrainees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndTrainees();
  }, [selectedSessionId]);

  /**
   * 🔹 3) Real-time attendance listener
   */
  useEffect(() => {
    if (!selectedSessionId) return;

    const q = query(collection(db, "attendance"), where("sessionId", "==", selectedSessionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AttendanceRecord)
      );
      setRecords(data);
    });

    return () => unsubscribe();
  }, [selectedSessionId]);

  /**
   * 🔹 4) Toggle attendance
   */
  const toggleAttendance = async (record: AttendanceRecord) => {
    if (!record.id) return;
    const ref = doc(db, "attendance", record.id);
    await updateDoc(ref, {
      status: record.status === "present" ? "absent" : "present",
      timestamp: serverTimestamp(),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Attendance Management
      </h1>

      {/* Session Selector */}
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Select Session:</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border rounded-lg shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="">-- Choose a session --</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || s.courseName || "Untitled"} —{" "}
              {s.date instanceof Timestamp
                ? s.date.toDate().toDateString()
                : (s.date as Date)?.toDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Table */}
      {selectedSessionId ? (
        <>
          {sessionDate && (
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Session Date:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {sessionDate.toDateString()}
              </span>
            </p>
          )}

          <Card className="shadow-md border border-gray-200 dark:border-gray-700">
            <CardContent>
              {loading ? (
                <p className="text-gray-700 dark:text-gray-300">Loading attendance...</p>
              ) : trainees.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No trainees enrolled in this course.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <th className="p-3 border">Name</th>
                        <th className="p-3 border">Email</th>
                        <th className="p-3 border">Status</th>
                        <th className="p-3 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainees.map((trainee) => {
                        const record = records.find((r) => r.studentId === trainee.id);
                        return (
                          <tr
                            key={trainee.id}
                            className="text-center odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                          >
                            <td className="p-3 border text-gray-800 dark:text-gray-200">
                              {trainee.name}
                            </td>
                            <td className="p-3 border text-gray-600 dark:text-gray-300">
                              {trainee.email}
                            </td>
                            <td className="p-3 border">
                              <span
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  record?.status === "present"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {record?.status === "present" ? "Present" : "Absent"}
                              </span>
                            </td>
                            <td className="p-3 border">
                              <input
                                type="checkbox"
                                checked={record?.status === "present"}
                                onChange={() => record && toggleAttendance(record)}
                                className="accent-green-600 w-5 h-5"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Please select a session to view attendance.
        </p>
      )}
    </div>
  );
};
