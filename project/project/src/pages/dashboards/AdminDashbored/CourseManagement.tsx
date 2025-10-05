import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Course, ActivityLog } from "../../../types";
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-2 relative">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<
    Omit<Course, "id" | "createdAt" | "updatedAt"> & { id?: string } | null
  >(null);

  const defaultCourse = {
    title: "",
    instructorName: "",
    category: "",
    duration: 0,
    hours: 0,
    level: "beginner" as const,
    startDate: new Date(),
    endDate: new Date(),
    materials: [] as string[],
    status: "draft" as const,
    instructorId: "",
  };

  const [newCourse, setNewCourse] = useState(defaultCourse);

  // Format Firestore timestamps
  useEffect(() => {
    if (coursesFromDB) {
      const formatted = coursesFromDB.map((course) => {
        const createdAt = (course.createdAt as any)?.toDate
          ? (course.createdAt as any).toDate()
          : course.createdAt instanceof Date
          ? course.createdAt
          : undefined;

        const updatedAt = (course.updatedAt as any)?.toDate
          ? (course.updatedAt as any).toDate()
          : course.updatedAt instanceof Date
          ? course.updatedAt
          : undefined;

        return {
          ...course,
          createdAt,
          updatedAt,
        };
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

  // Validate Dates
  const validateDates = (startDate: Date, endDate: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      alert("Start date must be today or later!");
      return false;
    }
    if (endDate < startDate) {
      alert("End date must be after the start date!");
      return false;
    }
    return true;
  };

  // Compute course status
  const getCourseStatus = (
    trainerExists: boolean,
    startDate: Date,
    endDate: Date
  ): "draft" | "active" | "completed" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!trainerExists) return "draft";
    if (today > endDate) return "completed";
    if (today >= startDate && today <= endDate) return "active";
    return "active";
  };

  // Add activity log
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

  // Add Course
  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.instructorName) {
      alert("Please fill all required fields.");
      return;
    }
    if (!validateDates(newCourse.startDate, newCourse.endDate)) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "trainer"));
      const querySnapshot = await getDocs(q);

      const matchingUser = querySnapshot.docs.find(
        (doc) =>
          doc.data().displayName.toLowerCase() === newCourse.instructorName.toLowerCase()
      );
      const trainerExists = !!matchingUser;
      const instructorUid = trainerExists ? matchingUser!.id : "";

      const status = getCourseStatus(trainerExists, newCourse.startDate, newCourse.endDate);

      const courseRef = await addDoc(collection(db, "courses"), {
        ...newCourse,
        instructorId: instructorUid,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCourses((prev) => [
        {
          ...newCourse,
          id: courseRef.id,
          instructorId: instructorUid,
          status,
          hours: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...prev,
      ]);

      // Log activity
      await logActivity("Admin", "added", `course: ${newCourse.title}`);

      setNewCourse(defaultCourse);
      setShowForm(false);
      alert("Course added successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingCourse || !editingCourse.instructorName) return;
    if (!validateDates(editingCourse.startDate, editingCourse.endDate)) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "trainer"));
      const querySnapshot = await getDocs(q);

      const matchingUser = querySnapshot.docs.find(
        (doc) =>
          doc.data().displayName.toLowerCase() === editingCourse.instructorName.toLowerCase()
      );

      const trainerExists = !!matchingUser;
      const instructorUid = trainerExists ? matchingUser!.id : "";

      const status = getCourseStatus(trainerExists, editingCourse.startDate, editingCourse.endDate);

      await updateDoc(doc(db, "courses", editingCourse.id!), {
        ...editingCourse,
        instructorId: instructorUid,
        status,
        updatedAt: serverTimestamp(),
      });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, ...editingCourse, instructorId: instructorUid, status, updatedAt: new Date() }
            : c
        )
      );

      // Log activity
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

      // Log activity
      await logActivity("Admin", "deleted", `course: ${course.title}`);

      alert("Course deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

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
            setNewCourse(defaultCourse);
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
          setNewCourse(defaultCourse);
          setShowForm(false);
        }}
      >
        <div className="p-6 w-full max-w-lg mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {editingCourse ? "Edit Course" : "Add New Course"}
          </h2>
          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <Input
              placeholder="Course Title"
              value={editingCourse ? editingCourse.title : newCourse.title}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, title: e.target.value })
                  : setNewCourse({ ...newCourse, title: e.target.value })
              }
            />
            {/* Instructor */}
            <Input
              placeholder="Instructor Name"
              value={editingCourse ? editingCourse.instructorName : newCourse.instructorName}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, instructorName: e.target.value })
                  : setNewCourse({ ...newCourse, instructorName: e.target.value })
              }
            />
            {/* Category */}
            <Input
              placeholder="Category"
              value={editingCourse ? editingCourse.category : newCourse.category}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, category: e.target.value })
                  : setNewCourse({ ...newCourse, category: e.target.value })
              }
            />
            {/* Duration */}
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
            {/* Level */}
            <select
              value={editingCourse ? editingCourse.level : newCourse.level}
              onChange={(e) =>
                editingCourse
                  ? setEditingCourse({ ...editingCourse, level: e.target.value as any })
                  : setNewCourse({ ...newCourse, level: e.target.value as any })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Dates */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col">
                <label className="text-gray-500 mb-1">Start Date</label>
                <DatePicker
                  selected={editingCourse ? editingCourse.startDate : newCourse.startDate}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    if (editingCourse) {
                      const adjustedEnd =
                        editingCourse.endDate && editingCourse.endDate < date ? date : editingCourse.endDate;
                      setEditingCourse({ ...editingCourse, startDate: date, endDate: adjustedEnd });
                    } else {
                      const adjustedEnd = newCourse.endDate && newCourse.endDate < date ? date : newCourse.endDate;
                      setNewCourse({ ...newCourse, startDate: date, endDate: adjustedEnd });
                    }
                  }}
                  minDate={new Date()}
                  placeholderText="Select Start Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-gray-500 mb-1">End Date</label>
                <DatePicker
                  selected={editingCourse ? editingCourse.endDate : newCourse.endDate}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    if (editingCourse) setEditingCourse({ ...editingCourse, endDate: date });
                    else setNewCourse({ ...newCourse, endDate: date });
                  }}
                  minDate={editingCourse ? editingCourse.startDate : newCourse.startDate}
                  placeholderText="Select End Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>

            {/* Status */}
            <Input
              value={
                editingCourse
                  ? editingCourse.status
                  : getCourseStatus(true, newCourse.startDate, newCourse.endDate)
              }
              readOnly
              placeholder="Status"
              className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={editingCourse ? handleSaveEdit : handleAddCourse}>
              {editingCourse ? "Save Changes" : "Add Course"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingCourse(null);
                setNewCourse(defaultCourse);
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
