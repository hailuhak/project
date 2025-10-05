import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { db } from "../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Session {
  id: string;
  title: string;
  regStart: string;
  regEnd: string;
  trainStart: string;
  trainEnd: string;
}

export const GeneralSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  // Helper to format YYYY-MM-DD into readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchSessions = async () => {
      const snapshot = await getDocs(collection(db, "sessions"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "",
        regStart: doc.data().regStart || "",
        regEnd: doc.data().regEnd || "",
        trainStart: doc.data().trainStart || "",
        trainEnd: doc.data().trainEnd || "",
      }));
      setSessions(data);
    };
    fetchSessions();
  }, []);

  return (
    <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          General Training Sessions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Reg Start
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Reg End
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Training Start
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Training End
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                    {session.title}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {formatDate(session.regStart)}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {formatDate(session.regEnd)}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {formatDate(session.trainStart)}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {formatDate(session.trainEnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
