import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

// Convert numeric grade to letter grade
const getGradeLetter = (grade: number) => {
  if (grade >= 90) return "A+";
  if (grade >= 85) return "A";
  if (grade >= 80) return "A-";
  if (grade >= 75) return "B+";
  if (grade >= 70) return "B";
  if (grade >= 65) return "B-";
  if (grade >= 60) return "C+";
  if (grade >= 55) return "C";
  if (grade >= 50) return "D";
  return "F";
};

// Determine color based on grade
const getLetterGradeColor = (grade: number) => {
  if (grade >= 80)
    return "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200";
  if (grade >= 60)
    return "bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200";
  return "bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 font-bold";
};

interface GradeItem {
  courseId: string;
  courseTitle: string;
  grade: number;
  letterGrade: string;
}

interface GradeRecord {
  traineeId: string;
  traineeName: string;
  courses: GradeItem[];
  total: number;
  average: number;
  cgpa: string;
}

export default function GradeReport() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Real-time listener for "grades" collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "grades"), (snapshot) => {
      const data: any[] = snapshot.docs.map((doc) => doc.data());
      const traineeMap: { [key: string]: GradeRecord } = {};

      data.forEach((g) => {
        if (!traineeMap[g.traineeId]) {
          traineeMap[g.traineeId] = {
            traineeId: g.traineeId,
            traineeName: g.traineeName,
            courses: [],
            total: 0,
            average: 0,
            cgpa: "0.00",
          };
        }

        traineeMap[g.traineeId].courses.push({
          courseId: g.courseId,
          courseTitle: g.courseTitle,
          grade: g.grade,
          letterGrade: getGradeLetter(g.grade),
        });
      });

      Object.values(traineeMap).forEach((t) => {
        const total = t.courses.reduce((sum, c) => sum + c.grade, 0);
        const maxTotal = t.courses.length * 100;
        const average = (total / maxTotal) * 100;
        t.total = total;
        t.average = average;
        t.cgpa = (average / 25).toFixed(2);
      });

      setGrades(Object.values(traineeMap));
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // ✅ Log activity to Firestore
  const logActivity = async (
    userName: string,
    action: string,
    target: string,
    details?: string
  ) => {
    try {
      await addDoc(collection(db, "activityLogs"), {
        userName,
        action,
        target,
        details: details || "",
        timestamp: serverTimestamp(),
      });
    } catch (err: any) {
      console.error("Failed to log activity:", err.message);
    }
  };

const handleSaveAll = async () => {
  try {
    for (const t of grades) {
      const q = query(
        collection(db, "finalGrade"),
        where("traineeId", "==", t.traineeId)
      );
      const existingDocs = await getDocs(q);

      if (!existingDocs.empty) {
        const existingDoc = existingDocs.docs[0];
        await setDoc(
          doc(db, "finalGrade", existingDoc.id),
          {
            traineeId: t.traineeId,
            traineeName: t.traineeName,
            courses: t.courses,
            total: t.total,
            average: t.average,
            cgpa: t.cgpa,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(doc(collection(db, "finalGrade")), {
          traineeId: t.traineeId,
          traineeName: t.traineeName,
          courses: t.courses,
          total: t.total,
          average: t.average,
          cgpa: t.cgpa,
          createdAt: serverTimestamp(),
        });
      }
    }

    await logActivity("Admin", "saved", "all final grades", "Grade report updated");
    alert("✅ Grades saved successfully!");
  } catch (error) {
    console.error("Error saving grades:", error);
    alert("❌ Failed to save grades. Check console for details.");
  }
};


  if (loading)
    return <div className="p-6 text-gray-700 dark:text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Grade Report
        </h2>
        <button
          onClick={handleSaveAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Save / Update All
        </button>
      </div>

      <Card className="w-full max-w-7xl shadow-lg">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="border px-4 py-2">Trainee</th>
                  <th className="border px-4 py-2">Courses</th>
                  <th className="border px-4 py-2">Result (100%)</th>
                  <th className="border px-4 py-2">Letter Grade</th>
                  <th className="border px-4 py-2">Total</th>
                  <th className="border px-4 py-2">Average (%)</th>
                  <th className="border px-4 py-2">CGPA</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((t) => (
                  <tr
                    key={t.traineeId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="border px-4 py-2 font-medium text-gray-900 dark:text-gray-200">
                      {t.traineeName}
                    </td>
                    <td className="border px-4 py-2 text-gray-800 dark:text-gray-300">
                      {t.courses.map((c, idx) => (
                        <div key={c.courseId}>
                          {c.courseTitle}
                          {idx < t.courses.length - 1 && (
                            <hr className="border-t border-gray-400 dark:border-gray-600 my-1" />
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.courses.map((c, idx) => (
                        <div key={c.courseId}>
                          <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-center">
                            {c.grade}
                          </div>
                          {idx < t.courses.length - 1 && (
                            <hr className="border-t border-gray-400 dark:border-gray-600 my-1" />
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.courses.map((c, idx) => (
                        <div key={c.courseId}>
                          <div
                            className={`px-2 py-1 rounded text-center ${getLetterGradeColor(
                              c.grade
                            )}`}
                          >
                            {c.letterGrade}
                          </div>
                          {idx < t.courses.length - 1 && (
                            <hr className="border-t border-gray-400 dark:border-gray-600 my-1" />
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.total}
                    </td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.average.toFixed(2)}%
                    </td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.cgpa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
