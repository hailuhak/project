import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, BookOpen, CreditCard as Edit2, Trash2 } from "lucide-react";
import { Course } from "../../types";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface CourseCardProps {
  course: Course;
  onEnroll?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showActions?: boolean;
  className?: string; // optional className for custom styling
}

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

// Utility to format date
export const formatDate = (value: any) => {
  if (!value) return "N/A";
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  if (value instanceof Date) return value.toLocaleDateString();
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEnroll,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  className = "",
}) => {
  const [sessionDates, setSessionDates] = useState<{ trainStart?: string; trainEnd?: string }>({});

  useEffect(() => {
    const fetchSessionDates = async () => {
      try {
        const sessionsSnap = await getDocs(collection(db, 'sessions'));
        if (!sessionsSnap.empty) {
          const sessionData = sessionsSnap.docs[0].data();
          setSessionDates({
            trainStart: sessionData.trainStart,
            trainEnd: sessionData.trainEnd,
          });
        }
      } catch (error) {
        console.error('Error fetching session dates:', error);
      }
    };

    fetchSessionDates();
  }, []);

  const levelColor = levelColors[course.level ?? "default"];
  const statusColor = statusColors[course.status ?? "default"];

  const displayStartDate = sessionDates.trainStart || course.startDate;
  const displayEndDate = sessionDates.trainEnd || course.endDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative hover:shadow-lg transition-shadow duration-300 rounded-xl flex flex-col justify-between h-full min-h-[280px] ${className}`}>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
              {course.title || "Untitled Course"}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColor}`}>
                {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "N/A"}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : "N/A"}
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            Trainer: {course.instructorName || "Unknown Instructor"}
          </p>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {course.hours ? `${course.hours} hours` : "N/A"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              {formatDate(displayStartDate)}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              {course.category || "Uncategorized"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              {displayEndDate ? formatDate(displayEndDate) : "N/A"}
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mt-4">
            <div className="flex flex-1 gap-2 flex-wrap">
              {onView && (
                <Button variant="outline" size="sm" onClick={onView} className="flex-1">
                  View Details
                </Button>
              )}
            </div>

            {onEnroll && course.status === "active" && (
              <div className="mt-2 sm:mt-0">
                <Button size="sm" onClick={onEnroll}>
                  Enroll Now
                </Button>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};
