import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

interface CourseGrade {
  courseId: string;
  courseTitle: string;
  grade: number;
  letterGrade: string;
}

interface FinalGrade {
  id: string;
  traineeId: string;
  traineeName: string;
  total: number;
  average: number;
  cgpa: string;
  courses: CourseGrade[];
  createdAt: any;
}

const TraineeGrades: React.FC = () => {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState<FinalGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "finalGrade"),
      where("traineeId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setGrades([]);
        setLoading(false);
        return;
      }

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FinalGrade[];

      setGrades(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading)
    return (
      <p className="text-center text-black dark:text-white">
        Loading grades...
      </p>
    );

  if (grades.length === 0)
    return (
      <p className="text-center text-black dark:text-white">
        No grades found for your enrolled courses yet.
      </p>
    );

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
        Your Final Grades
      </h2>

      {grades.map((finalGrade) => (
        <div
          key={finalGrade.id}
          className="mb-6 border border-black dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md transition-colors duration-300"
        >
          <p className="font-medium mb-2 text-black dark:text-white">
            Trainee: {finalGrade.traineeName}
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-black dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    Course Title
                  </th>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    Grade
                  </th>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    Letter Grade
                  </th>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    Total
                  </th>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    Average
                  </th>
                  <th className="px-4 py-2 border-b border-black dark:border-gray-600 text-left text-black dark:text-white">
                    CGPA
                  </th>
                </tr>
              </thead>
              <tbody>
                {finalGrade.courses.map((course, index) => (
                  <tr
                    key={course.courseId}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-2 border-b border-black dark:border-gray-600 text-black dark:text-white">
                      {course.courseTitle}
                    </td>
                    <td className="px-4 py-2 border-b border-black dark:border-gray-600 text-black dark:text-white">
                      {course.grade}
                    </td>
                    <td
                      className={`px-4 py-2 border-b border-black dark:border-gray-600 font-semibold text-center ${
                        course.grade >= 80
                          ? "text-green-600 dark:text-green-400"
                          : course.grade >= 60
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {course.letterGrade}
                    </td>
                    {index === 0 && (
                      <>
                        <td
                          className="px-4 py-2 border-b border-black dark:border-gray-600 text-black dark:text-white text-center font-semibold"
                          rowSpan={finalGrade.courses.length}
                        >
                          {finalGrade.total}
                        </td>
                        <td
                          className="px-4 py-2 border-b border-black dark:border-gray-600 text-black dark:text-white text-center font-semibold"
                          rowSpan={finalGrade.courses.length}
                        >
                          {finalGrade.average.toFixed(2)}%
                        </td>
                        <td
                          className="px-4 py-2 border-b border-black dark:border-gray-600 text-black dark:text-white text-center font-semibold"
                          rowSpan={finalGrade.courses.length}
                        >
                          {finalGrade.cgpa}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TraineeGrades;
