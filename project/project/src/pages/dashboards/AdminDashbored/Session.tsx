import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Pencil, Trash2 } from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";

interface SessionType {
  id?: string;
  title: string;
  regStart: string;
  regEnd: string;
  trainStart: string;
  trainEnd: string;
}

export default function Session() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<SessionType>({
    title: "",
    regStart: "",
    regEnd: "",
    trainStart: "",
    trainEnd: "",
  });
  const [errors, setErrors] = useState({
    regEnd: "",
    trainStart: "",
    trainEnd: "",
  });

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const autoTitle = `Session ${currentYear}-${nextYear}`;

  // Fetch all sessions
  const fetchSessions = async () => {
    const snapshot = await getDocs(collection(db, "sessions"));
    setSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SessionType)));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Activity logger
  const logActivity = async (action: string, target: string, message?: string) => {
    try {
      await setDoc(doc(collection(db, "activityLogs")), {
        userName: auth.currentUser?.displayName || "Admin",
        action,
        target,
        message: message || "",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  // Validate session dates
  const validateDates = () => {
    let newErrors = { regEnd: "", trainStart: "", trainEnd: "" };
    const regStartDate = new Date(newSession.regStart);
    const regEndDate = new Date(newSession.regEnd);
    const trainStartDate = new Date(newSession.trainStart);
    const trainEndDate = new Date(newSession.trainEnd);

    if (newSession.regEnd && regEndDate < regStartDate) {
      newErrors.regEnd = "❌ Registration end must be after start.";
    }
    if (newSession.trainStart && trainStartDate <= regEndDate) {
      newErrors.trainStart = "❌ Training must start after registration ends.";
    }
    if (newSession.trainEnd && trainEndDate < trainStartDate) {
      newErrors.trainEnd = "❌ Training end must be after training start.";
    }

    setErrors(newErrors);
    return !newErrors.regEnd && !newErrors.trainStart && !newErrors.trainEnd;
  };

  useEffect(() => {
    validateDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSession]);

  // Save or update session
  const handleSaveSession = async () => {
    if (!validateDates()) return;

    if (editingId) {
      const sessionRef = doc(db, "sessions", editingId);
      await updateDoc(sessionRef, {
        ...newSession,
        title: autoTitle,
      });
      await logActivity("update", autoTitle, "Session updated successfully.");
      alert(`✅ ${autoTitle} updated!`);
    } else {
      const docRef = await addDoc(collection(db, "sessions"), {
        ...newSession,
        title: autoTitle,
        createdAt: serverTimestamp(),
      });
      await logActivity("create", autoTitle, "New session created.");
      alert(`✅ ${autoTitle} created!`);
    }

    setNewSession({ title: "", regStart: "", regEnd: "", trainStart: "", trainEnd: "" });
    setEditingId(null);
    setShowForm(false);
    fetchSessions();
  };

  // Delete session
  const handleDeleteSession = async (id: string, title: string) => {
    if (window.confirm("⚠️ Are you sure you want to delete this session?")) {
      await deleteDoc(doc(db, "sessions", id));
      await logActivity("delete", title, "Session deleted.");
      fetchSessions();
    }
  };

  // Edit session
  const handleEditSession = (session: SessionType) => {
    setEditingId(session.id || null);
    setNewSession({
      title: session.title,
      regStart: session.regStart,
      regEnd: session.regEnd,
      trainStart: session.trainStart,
      trainEnd: session.trainEnd,
    });
    setShowForm(true);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            📅 Sessions
          </h2>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setNewSession({ title: "", regStart: "", regEnd: "", trainStart: "", trainEnd: "" });
            }}
          >
            {showForm ? "Close Form" : "➕ Create Session"}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg mb-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
              {editingId ? "✏️ Edit Session" : "🆕 Create New Session"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Session Title
                </label>
                <Input
                  value={autoTitle}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Registration Start */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Registration Start
                </label>
                <Input
                  type="date"
                  value={newSession.regStart}
                  onChange={(e) => setNewSession({ ...newSession, regStart: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Registration End */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Registration End
                </label>
                <Input
                  type="date"
                  value={newSession.regEnd}
                  onChange={(e) => setNewSession({ ...newSession, regEnd: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                />
                {errors.regEnd && <p className="text-xs text-red-500 mt-1">{errors.regEnd}</p>}
              </div>

              {/* Training Start */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Training Start
                </label>
                <Input
                  type="date"
                  value={newSession.trainStart}
                  onChange={(e) => setNewSession({ ...newSession, trainStart: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                />
                {errors.trainStart && <p className="text-xs text-red-500 mt-1">{errors.trainStart}</p>}
              </div>

              {/* Training End */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Training End
                </label>
                <Input
                  type="date"
                  value={newSession.trainEnd}
                  onChange={(e) => setNewSession({ ...newSession, trainEnd: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                />
                {errors.trainEnd && <p className="text-xs text-red-500 mt-1">{errors.trainEnd}</p>}
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <Button variant="destructive" onClick={() => setShowForm(false)} className="bg-red-500 hover:bg-red-600 text-white">
                Cancel
              </Button>
              <Button onClick={handleSaveSession} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Title</th>
                <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Reg Start</th>
                <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Reg End</th>
                <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Training Start</th>
                <th className="px-4 py-2 text-left border border-gray-200 dark:border-gray-700">Training End</th>
                <th className="px-4 py-2 text-center border border-gray-200 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-gray-100">{s.title}</td>
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{s.regStart}</td>
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{s.regEnd}</td>
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{s.trainStart}</td>
                  <td className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{s.trainEnd}</td>
                  <td className="px-4 py-2 text-center flex items-center justify-center space-x-3">
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleEditSession(s)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => handleDeleteSession(s.id!, s.title)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
