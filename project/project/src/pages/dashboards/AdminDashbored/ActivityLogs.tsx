import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { collection, onSnapshot, orderBy, query, limit, Timestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { ActivityLog } from "../../../types";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, "activityLogs");
    const q = query(logsRef, orderBy("timestamp", "desc"), limit(10)); // fetch only 10 latest logs

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: ActivityLog[] = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            userName: docData.userName || 'Unknown',
            userId: docData.userId || '',
            userRole: docData.userRole || 'trainee',
            trainerId: docData.trainerId,
            action: docData.action || '',
            target: docData.target || '',
            details: docData.details || '',
            timestamp: docData.timestamp instanceof Timestamp
              ? docData.timestamp.toDate()
              : new Date(docData.timestamp),
          };
        });

        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching activity logs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track the 10 most recent actions and changes happening in the system.
        </p>
      </div>

      {/* Activity Logs Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No activity logs found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.userName}</span> {activity.action}{" "}
                      {activity.target}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
