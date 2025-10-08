import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Course, ActivityLog, Session } from "../../../types";
import { useFirestoreQuery } from "../../../hooks/useFirestoreQuery";
import { db } from "../../../lib/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-white font-bold text-xl"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export const CourseManagement: React.FC = () => {
  const { data: coursesFromDB, loading: coursesLoading } = useFirestoreQuery<Course>(
    "courses",
    [orderBy("createdAt", "desc"), limit(20)]
  );

  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState<Omit<Course, "id" | "createdAt" | "updatedAt">>({
    title: "",
    instructorName: "",
    instructorId: "",
    category: "",
    duration: 0,
    hours: 0,
    level: "beginner",
    startDate: new Date(),
    endDate: new Date(),
    materials: [],
    status: "draft",
    students: [],
  });
  const [newMaterial, setNewMaterial] = useState("");

  // Load sessions in real-time
  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions: Session[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          regStart: data.regStart,
          regEnd: data.regEnd,
          trainStart: data.trainStart,
          trainEnd: data.trainEnd,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setSessions(loadedSessions);
    });
    return () => unsubscribe();
  }, []);

  // Format courses
  useEffect(() => {
    if (coursesFromDB) {
      const formatted = coursesFromDB.map((course) => {
        const createdAt = (course.createdAt as any)?.toDate
          ? (course.createdAt as any).toDate()
          : course.createdAt instanceof Date
          ? course.createdAt
          : new Date();
        const updatedAt = (course.updatedAt as any)?.toDate
          ? (course.updatedAt as any).toDate()
          : course.updatedAt instanceof Date
          ? course.updatedAt
          : new Date();
        return { ...course, createdAt, updatedAt };
      });
      setCourses(formatted);
    }
  }, [coursesFromDB]);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Validate course dates based on session
  const validateDatesWithSessions = (startDate: Date, endDate: Date) => {
    if (sessions.length === 0) return true;
    const session = sessions[0]; // assume general session
    const trainStart = new Date(session.trainStart);
    const trainEnd = new Date(session.trainEnd);

    if (startDate < trainStart) {
      alert(`Course start date cannot be before session start: ${trainStart.toDateString()}`);
      return false;
    }
    if (endDate > trainEnd) {
      alert(`Course end date cannot be after session end: ${trainEnd.toDateString()}`);
      return false;
    }
    if (endDate < startDate) {
      alert("Course end date cannot be before start date.");
      return false;
    }
    return true;
  };

  // Compute course status
  const computeStatus = (trainerExists: boolean, startDate: Date, endDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!trainerExists) return "draft";
    if (today > endDate) return "completed";
    if (today >= startDate && today <= endDate) return "active";
    return "active";
  };

  // Log activity
  const logActivity = async (userName: string, action: string, target: string, details?: string) => {
    try {
      await addDoc(collection(db, "activityLogs"), {
        userName,
        action,
        target,
        details: details || "",
        timestamp: serverTimestamp(),
      } as ActivityLog);
    } catch (err: any) {
      console.error("Failed to log activity:", err.message);
    }
  };

  // Helper to get instructor UID by name
  const getInstructorUid = async (instructorName: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("displayName", "==", instructorName));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].id;
    return "";
  };

  // Add Course
  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.instructorName) {
      alert("Please fill all required fields.");
      return;
    }
    if (!validateDatesWithSessions(newCourse.startDate, newCourse.endDate)) return;

    try {
      const instructorId = await getInstructorUid(newCourse.instructorName);
      const status = computeStatus(!!instructorId, newCourse.startDate, newCourse.endDate);

      const courseRef = await addDoc(collection(db, "courses"), {
        ...newCourse,
        instructorId,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCourses((prev) => [
        { ...newCourse, id: courseRef.id, instructorId, status, createdAt: new Date(), updatedAt: new Date() },
        ...prev,
      ]);

      await logActivity("Admin", "added", `course: ${newCourse.title}`);
      setNewCourse({ ...newCourse, ...defaultCourse });
      setNewMaterial("");
      setShowForm(false);
      alert("Course added successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  // Edit Course
  const handleSaveEdit = async () => {
    if (!editingCourse || !editingCourse.instructorName) return;
    if (!validateDatesWithSessions(editingCourse.startDate, editingCourse.endDate)) return;

    try {
      const instructorId = await getInstructorUid(editingCourse.instructorName);
      const status = computeStatus(!!instructorId, editingCourse.startDate, editingCourse.endDate);

      await updateDoc(doc(db, "courses", editingCourse.id!), {
        ...editingCourse,
        instructorId,
        status,
        updatedAt: serverTimestamp(),
      });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, ...editingCourse, instructorId, status, updatedAt: new Date() }
            : c
        )
      );

      await logActivity("Admin", "edited", `course: ${editingCourse.title}`);
      setEditingCourse(null);
      setShowForm(false);
      alert("Course updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteDoc(doc(db, "courses", course.id!));
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      await logActivity("Admin", "deleted", `course: ${course.title}`);
      alert("Course deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  // Materials
  const handleAddMaterial = () => {
    if (!newMaterial.trim()) return;
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, materials: [...editingCourse.materials, newMaterial] });
    } else {
      setNewCourse({ ...newCourse, materials: [...newCourse.materials, newMaterial] });
    }
    setNewMaterial("");
  };
  const handleRemoveMaterial = (index: number) => {
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, materials: editingCourse.materials.filter((_, i) => i !== index) });
    } else {
      setNewCourse({ ...newCourse, materials: newCourse.materials.filter((_, i) => i !== index) });
    }
  };

  // DatePicker CSS classes
  const datePickerClass =
    "border rounded p-2 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600";

  return (
    <div className="space-y-6">
           {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all courses</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingCourse(null);
            setNewCourse({ ...newCourse, startDate: new Date(), endDate: new Date(), materials: [] });
            setNewMaterial("");
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-96"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setEditingCourse(null);
          setNewCourse({ ...newCourse, startDate: new Date(), endDate: new Date(), materials: [] });
          setNewMaterial("");
          setShowForm(false);
        }}
      >
        <div className="p-6 w-full max-w-lg mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {editingCourse ? "Edit Course" : "Add New Course"}
          </h2>

          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            <Input
              placeholder="Course Title"
              value={editingCourse ? editingCourse.title : newCourse.title}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, title: e.target.value })
                  : setNewCourse({ ...newCourse, title: e.target.value })
              }
            />
            <Input
              placeholder="Instructor Name"
              value={editingCourse ? editingCourse.instructorName : newCourse.instructorName}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, instructorName: e.target.value })
                  : setNewCourse({ ...newCourse, instructorName: e.target.value })
              }
            />
            <Input
              placeholder="Category"
              value={editingCourse ? editingCourse.category : newCourse.category}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, category: e.target.value })
                  : setNewCourse({ ...newCourse, category: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Duration (hours)"
              value={editingCourse ? editingCourse.hours || "" : newCourse.duration || ""}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, hours: Number(e.target.value) })
                  : setNewCourse({ ...newCourse, duration: Number(e.target.value) })
              }
            />

            {/* Date Pickers */}
            <div className="flex gap-2">
              <div className="flex flex-col w-full">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <DatePicker
                  selected={editingCourse ? editingCourse.startDate : newCourse.startDate}
                  onChange={(date: Date) =>
                    editingCourse
                      ? setEditingCourse({ ...editingCourse, startDate: date })
                      : setNewCourse({ ...newCourse, startDate: date })
                  }
                  className={datePickerClass}
                />
              </div>
              <div className="flex flex-col w-full">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <DatePicker
                  selected={editingCourse ? editingCourse.endDate : newCourse.endDate}
                  onChange={(date: Date) =>
                    editingCourse
                      ? setEditingCourse({ ...editingCourse, endDate: date })
                      : setNewCourse({ ...newCourse, endDate: date })
                  }
                  className={datePickerClass}
                />
              </div>
            </div>

            {/* Materials */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add Material"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                />
                <Button onClick={handleAddMaterial}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editingCourse ? editingCourse.materials : newCourse.materials).map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded px-2 py-1"
                  >
                    {mat}
                    <X
                      className="cursor-pointer"
                      onClick={() => handleRemoveMaterial(idx)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={editingCourse ? handleSaveEdit : handleAddCourse}>
              {editingCourse ? "Save Changes" : "Add Course"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingCourse(null);
                setNewCourse({ ...newCourse, startDate: new Date(), endDate: new Date(), materials: [] });
                setNewMaterial("");
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesLoading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
              </div>
            ))
          : filteredCourses.length === 0
          ? <p className="text-center text-gray-500 dark:text-gray-400">No courses found.</p>
          : filteredCourses.map((course) => (
              <Card key={course.id}>
                <CardContent>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    <strong>Trainer: </strong> {course.instructorName} | <strong>Status:</strong> {course.status}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Edit2
                      className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                      onClick={() => {
                        setEditingCourse(course);
                        setShowForm(true);
                      }}
                    />
                    <Trash2
                      className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => handleDeleteCourse(course)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};

