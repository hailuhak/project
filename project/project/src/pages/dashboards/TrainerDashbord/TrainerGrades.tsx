import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, CardHeader, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

interface Course {
  courseId: string;
  title: string;
}

interface Enrollment {
  userId: string;
  courses: Course[];
}

interface User {
  displayName: string;
}

export const TrainerGrades: React.FC = () => {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: number }>({});
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});

  // Fetch enrollments grouped by trainee
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, "enrollments"), async (snapshot) => {
      const data: { [userId: string]: Enrollment } = {};
      const userIdsToFetch: Set<string> = new Set();

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const userId = d.userId;

        if (!data[userId]) data[userId] = { userId, courses: [] };
        if (Array.isArray(d.courses)) {
          d.courses.forEach((course: any) => {
            if (course.instructorId === currentUser.uid) {
              data[userId].courses.push({ courseId: course.courseId, title: course.title });
              userIdsToFetch.add(userId);
            }
          });
        }
      });

      setEnrollments(Object.values(data));

      // Fetch user names from "users" collection
      const names: { [key: string]: string } = {};
      await Promise.all(
        Array.from(userIdsToFetch).map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            names[uid] = userData.displayName || "Unknown";
          } else {
            names[uid] = "Unknown";
          }
        })
      );

      setUserNames(names);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle input changes
  const handleInputChange = (userId: string, courseId: string, value: number) => {
    const key = `${userId}_${courseId}`;
    setGrades({ ...grades, [key]: value });
  };

  // Save all grades for a trainee
  const handleSave = async (trainee: Enrollment) => {
    if (!currentUser) return;

    for (const course of trainee.courses) {
      const key = `${trainee.userId}_${course.courseId}`;
      const gradeValue = grades[key];
      if (gradeValue == null) continue;

      const q = query(
        collection(db, "grades"),
        where("trainerId", "==", currentUser.uid),
        where("traineeId", "==", trainee.userId),
        where("courseId", "==", course.courseId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, { grade: gradeValue, updatedAt: Timestamp.now() });
      } else {
        await addDoc(collection(db, "grades"), {
          traineeId: trainee.userId,
          traineeName: userNames[trainee.userId] || "Unknown",
          courseId: course.courseId,
          courseTitle: course.title,
          trainerId: currentUser.uid,
          grade: gradeValue,
          createdAt: Timestamp.now(),
        });
      }
    }

    alert(`✅ Grades saved for ${userNames[trainee.userId] || "Unknown"}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Trainee Grades
      </h2>

      {enrollments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No trainees found under your supervision.
        </p>
      ) : (
        enrollments.map((trainee) => (
          <Card
            key={trainee.userId}
            className="mb-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {userNames[trainee.userId] || "Unknown"}
              </h3>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition"
                onClick={() => handleSave(trainee)}
              >
                Save
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                        Course
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                        Result (100%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainee.courses.map((course) => {
                      const key = `${trainee.userId}_${course.courseId}`;
                      return (
                        <tr
                          key={course.courseId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200">
                            {course.title}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-1 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={grades[key] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  trainee.userId,
                                  course.courseId,
                                  Number(e.target.value)
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
