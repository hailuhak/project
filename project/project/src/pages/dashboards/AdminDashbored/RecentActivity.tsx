// components/Cards/RecentActivity.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

// Firestore ActivityLog interface
export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: Timestamp | Date;
}

// Props for this component
interface RecentActivityProps {
  search?: string;
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  autoRefresh?: boolean; // true = realtime, false = one-time fetch
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  search = "",
  startDate = "",
  endDate = "",
  autoRefresh = true,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
    let unsubscribe: (() => void) | undefined;

    if (autoRefresh) {
      // Real-time updates
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activityData: ActivityLog[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ActivityLog, "id">),
          }));
          setLogs(activityData);
          setLoading(false);
        },
        (err) => {
          console.error("Error listening to activity logs:", err);
          setError("Failed to load activity logs.");
          setLoading(false);
        }
      );
    } else {
      // One-time fetch
      getDocs(q)
        .then((snapshot) => {
          const activityData: ActivityLog[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ActivityLog, "id">),
          }));
          setLogs(activityData);
        })
        .catch((err) => {
          console.error("Error fetching activity logs:", err);
          setError("Failed to fetch activity logs.");
        })
        .finally(() => setLoading(false));
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [autoRefresh]);

  // Apply filters
  const filteredLogs = logs.filter((log) => {
    let matches = true;
    const logDate =
      log.timestamp instanceof Timestamp
        ? log.timestamp.toDate()
        : (log.timestamp as Date);

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      if (
        !log.user?.toLowerCase().includes(s) &&
        !log.action?.toLowerCase().includes(s)
      ) {
        matches = false;
      }
    }

    // Date range filters
    if (startDate) {
      const start = new Date(startDate);
      if (logDate < start) matches = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (logDate > end) matches = false;
    }

    return matches;
  });

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Recent Activity
      </h2>

      {loading && (
        <p className="text-gray-500 dark:text-gray-400">Loading activity...</p>
      )}

      {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

      {!loading && !error && (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLogs.length === 0 ? (
            <li className="py-2 text-gray-500 dark:text-gray-400">
              No activity found.
            </li>
          ) : (
            filteredLogs.map((log) => {
              const date =
                log.timestamp instanceof Timestamp
                  ? log.timestamp.toDate()
                  : (log.timestamp as Date);

              return (
                <li key={log.id} className="py-2">
                  <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-medium">{log.user}</span> {log.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {date.toLocaleString()}
                  </p>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
