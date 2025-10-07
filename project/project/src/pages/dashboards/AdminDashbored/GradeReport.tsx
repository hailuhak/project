import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

// Convert numeric grade to letter grade
const getGradeLetter = (grade: number) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
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

  // Fetch grades from Firestore
  useEffect(() => {
    const fetchGrades = async () => {
      const snapshot = await getDocs(collection(db, "grades"));
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
    };

    fetchGrades();
  }, []);

  // Save all grades to Firestore
  const handleSaveAll = async () => {
    for (const t of grades) {
      for (const course of t.courses) {
        const snapshot = await getDocs(collection(db, "grades"));
        const docExist = snapshot.docs.find(
          (d) =>
            d.data().traineeId === t.traineeId &&
            d.data().courseId === course.courseId
        );

        if (docExist) {
          const ref = doc(db, "grades", docExist.id);
          await updateDoc(ref, {
            grade: course.grade,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(collection(db, "grades")), {
            traineeId: t.traineeId,
            traineeName: t.traineeName,
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            grade: course.grade,
            createdAt: serverTimestamp(),
          });
        }
      }
    }
    alert("✅ All grades saved successfully!");
  };

  if (loading)
    return <div className="p-6 text-gray-700 dark:text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Report</h2>
        <button
          onClick={handleSaveAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Save All
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
                      {t.courses.map((c) => (
                        <div key={c.courseId}>{c.courseTitle}</div>
                      ))}
                    </td>

                    {/* Read-only Result */}
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.courses.map((c) => (
                        <div
                          key={c.courseId}
                          className="mb-1 px-2 py-1 border rounded bg-gray-200 dark:bg-gray-700 text-center"
                        >
                          {c.grade}
                        </div>
                      ))}
                    </td>

                    {/* Letter Grade */}
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">
                      {t.courses.map((c) => (
                        <div
                          key={c.courseId}
                          className={`mb-1 px-2 py-1 border rounded text-center ${
                            c.grade < 60
                              ? "bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 font-bold"
                              : "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200"
                          }`}
                        >
                          {c.letterGrade}
                        </div>
                      ))}
                    </td>

                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">{t.total}</td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">{t.average.toFixed(2)}%</td>
                    <td className="border px-4 py-2 text-gray-900 dark:text-gray-100">{t.cgpa}</td>
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
