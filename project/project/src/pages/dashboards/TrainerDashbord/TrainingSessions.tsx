import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Plus, Calendar, X, Edit2, Trash2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { 
  collection, addDoc, query, where, onSnapshot, Timestamp, 
  getDocs, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { TrainingSession, Course } from "../../../types";

interface GeneralSession {
  id: string;
  title: string;
  regStart: string;
  regEnd: string;
  trainStart: string;
  trainEnd: string;
}

export const TrainingSessions: React.FC = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [generalSessions, setGeneralSessions] = useState<GeneralSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      const snapshot = await getDocs(collection(db, "courses"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Course) }));
      setCourses(data);
    };
    fetchCourses();
  }, []);

  // Fetch trainer-specific sessions in real-time
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "trainingSessions"), where("trainerId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrainingSession, "id">),
        date: (doc.data().date as Timestamp).toDate(),
      }));
      data.sort((a, b) => a.date.getTime() - b.date.getTime());
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch general sessions
  useEffect(() => {
    const fetchSessions = async () => {
      const snapshot = await getDocs(collection(db, "sessions"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "",
        regStart: doc.data().regStart || "",
        regEnd: doc.data().regEnd || "",
        trainStart: doc.data().trainStart || "",
        trainEnd: doc.data().trainEnd || "",
      }));
      setGeneralSessions(data);
    };
    fetchSessions();
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const formatStringDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSchedule = async () => {
    if (!courseId || !date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const durationHours = parseFloat(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
    const course = courses.find((c) => c.id === courseId);

    if (editingSessionId) {
      const sessionRef = doc(db, "trainingSessions", editingSessionId);
      await updateDoc(sessionRef, {
        courseId,
        courseName: course?.title || "",
        date: start,
        hours: durationHours,
      });
      setEditingSessionId(null);
    } else {
      await addDoc(collection(db, "trainingSessions"), {
        courseId,
        courseName: course?.title || "",
        date: start,
        hours: durationHours,
        attendees: [],
        trainerId: currentUser?.uid,
        createdAt: new Date(),
      });
    }

    setCourseId("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setShowFormModal(false);
  };

  const handleEdit = (session: TrainingSession) => {
    setEditingSessionId(session.id);
    setCourseId(session.courseId);
    setDate(session.date.toISOString().split("T")[0]);
    setStartTime(session.date.toTimeString().split(":").slice(0, 2).join(":"));
    const endTimeDate = new Date(session.date.getTime() + session.hours * 60 * 60 * 1000);
    setEndTime(endTimeDate.toTimeString().split(":").slice(0, 2).join(":"));
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    await deleteDoc(doc(db, "trainingSessions", id));
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* ---------- General Sessions ---------- */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            General Training Sessions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Reg Start</th>
                  <th className="px-4 py-3 text-left">Reg End</th>
                  <th className="px-4 py-3 text-left">Training Start</th>
                  <th className="px-4 py-3 text-left">Training End</th>
                </tr>
              </thead>
              <tbody>
                {generalSessions.map((session, idx) => (
                  <tr
                    key={session.id}
                    className={`border-b border-gray-200 dark:border-gray-700 ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{session.title}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatStringDate(session.regStart)}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatStringDate(session.regEnd)}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatStringDate(session.trainStart)}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatStringDate(session.trainEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Trainer's Sessions ---------- */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Training Sessions
          </h1>
          <Button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4" /> Add Session
          </Button>
        </div>

        <Card className="bg-white dark:bg-gray-900 shadow-md overflow-x-auto">
          <CardContent>
            {loading ? (
              <p className="text-gray-700 dark:text-gray-300">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No sessions scheduled yet.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <th className="px-4 py-2 text-left">Course</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Start Time</th>
                    <th className="px-4 py-2 text-left">End Time</th>
                    <th className="px-4 py-2 text-left">Duration (hrs)</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, idx) => {
                    const start = new Date(s.date);
                    const end = new Date(start.getTime() + s.hours * 60 * 60 * 1000);
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-gray-200 dark:border-gray-700 ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        } hover:bg-gray-100 dark:hover:bg-gray-700`}
                      >
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{s.courseName}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatDate(start)}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{s.hours.toFixed(2)}</td>
                        <td className="px-4 py-2 flex gap-3">
                          <Edit2
                            className="w-5 h-5 cursor-pointer text-blue-600 hover:text-blue-400"
                            onClick={() => handleEdit(s)}
                          />
                          <Trash2
                            className="w-5 h-5 cursor-pointer text-red-600 hover:text-red-400"
                            onClick={() => handleDelete(s.id!)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- Modal ---------- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              onClick={() => {
                setShowFormModal(false);
                setEditingSessionId(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingSessionId ? "Edit Training Session" : "Add Training Session"}
            </h2>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border p-2 rounded w-full mb-3 text-gray-900 dark:text-gray-100 dark:bg-gray-700"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 rounded w-full mb-3 text-gray-900 dark:text-gray-100 dark:bg-gray-700"
            />
            <div className="flex gap-2 mb-3">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border p-2 rounded w-full text-gray-900 dark:text-gray-100 dark:bg-gray-700"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border p-2 rounded w-full text-gray-900 dark:text-gray-100 dark:bg-gray-700"
              />
            </div>
            <Button
              onClick={handleSchedule}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
            >
              {editingSessionId ? "Update Session" : "Save Session"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
