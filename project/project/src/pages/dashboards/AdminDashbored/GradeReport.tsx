import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";

// Utility: Convert average score to letter grade
const getGradeLetter = (avg: number): string => {
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
};

interface Course {
  name: string;
  points: number;
  max: number;
}

interface GradeRecord {
  id: string;
  trainee: string;
  courses: Course[];
  total: number;
  maxTotal: number;
  average: number;
  gradeLetter: string;
  cgpa: string;
}

export default function GradeReport() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      const snapshot = await getDocs(collection(db, "grades"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
      const processed: GradeRecord[] = data.map((g) => processGrade(g));
      setGrades(processed);
    };
    fetchGrades();
  }, []);

  // Process grade to calculate total, avg, letter grade, CGPA
  const processGrade = (g: any): GradeRecord => {
    const total = g.courses.reduce((sum: number, c: Course) => sum + Number(c.points), 0);
    const maxTotal = g.courses.reduce((sum: number, c: Course) => sum + Number(c.max), 0);
    const avg = (total / maxTotal) * 100;

    return {
      id: g.id,
      trainee: g.trainee,
      courses: g.courses,
      total,
      maxTotal,
      average: avg,
      gradeLetter: getGradeLetter(avg),
      cgpa: (avg / 25).toFixed(2),
    };
  };

  // Activity log helper
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

  // Update course score
  const handleScoreChange = async (gIndex: number, cIndex: number, value: string) => {
    const updatedGrades = [...grades];
    const courseName = updatedGrades[gIndex].courses[cIndex].name;
    const traineeName = updatedGrades[gIndex].trainee;

    updatedGrades[gIndex].courses[cIndex].points = Number(value);

    // Recalculate totals
    const updatedRecord = processGrade(updatedGrades[gIndex]);
    updatedGrades[gIndex] = updatedRecord;
    setGrades(updatedGrades);

    // Save to Firestore
    const ref = doc(db, "grades", updatedRecord.id);
    await updateDoc(ref, { courses: updatedRecord.courses });

    // Log activity
    await logActivity(
      "update",
      `${traineeName} - ${courseName}`,
      `Score updated to ${value}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-start justify-start p-6">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Grade Report
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="border px-4 py-2">Trainee</th>
                  <th className="border px-4 py-2">Courses</th>
                  <th className="border px-4 py-2">Result (100%)</th>
                  <th className="border px-4 py-2">Total</th>
                  <th className="border px-4 py-2">Average (%)</th>
                  <th className="border px-4 py-2">Grade</th>
                  <th className="border px-4 py-2">CGPA</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, gIndex) => (
                  <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="border px-4 py-2 font-medium">{g.trainee}</td>

                    {/* List of Courses */}
                    <td className="border px-4 py-2">
                      {g.courses.map((c, i) => (
                        <div key={i}>{c.name}</div>
                      ))}
                    </td>

                    {/* Editable Results per course */}
                    <td className="border px-4 py-2">
                      {g.courses.map((c, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={c.max}
                            value={c.points}
                            onChange={(e) => handleScoreChange(gIndex, i, e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:text-white"
                          />
                          <span>/ {c.max}</span>
                        </div>
                      ))}
                    </td>

                    {/* Totals */}
                    <td className="border px-4 py-2">{g.total} / {g.maxTotal}</td>

                    {/* Average */}
                    <td className="border px-4 py-2">{g.average.toFixed(2)}%</td>

                    {/* Grade */}
                    <td className="border px-4 py-2 font-semibold text-center">{g.gradeLetter}</td>

                    {/* CGPA */}
                    <td className="border px-4 py-2">{g.cgpa}</td>
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
