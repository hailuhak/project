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

  if (loading) return <p>Loading grades...</p>;
  if (grades.length === 0) return <p>No grades found for your enrolled courses yet.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Your Final Grades
      </h2>

      {grades.map((finalGrade) => (
        <div key={finalGrade.id} className="mb-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">
            Trainee: {finalGrade.traineeName}
          </p>

          <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 border-b text-left">Course Title</th>
                <th className="px-4 py-2 border-b text-left">Grade</th>
                <th className="px-4 py-2 border-b text-left">Letter Grade</th>
                <th className="px-4 py-2 border-b text-left">Total</th>
                <th className="px-4 py-2 border-b text-left">Average</th>
                <th className="px-4 py-2 border-b text-left">CGPA</th>
              </tr>
            </thead>
            <tbody>
              {finalGrade.courses.map((course, index) => (
                <tr
                  key={course.courseId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <td className="px-4 py-2 border-b">{course.courseTitle}</td>
                  <td className="px-4 py-2 border-b">{course.grade}</td>
                  <td className="px-4 py-2 border-b">{course.letterGrade}</td>
                  {/* Only show total, average, cgpa in the first row */}
                  {index === 0 && (
                    <>
                      <td className="px-4 py-2 border-b" rowSpan={finalGrade.courses.length}>
                        {finalGrade.total}
                      </td>
                      <td className="px-4 py-2 border-b" rowSpan={finalGrade.courses.length}>
                        {finalGrade.average.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 border-b" rowSpan={finalGrade.courses.length}>
                        {finalGrade.cgpa}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TraineeGrades;
