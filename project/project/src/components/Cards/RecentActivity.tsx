import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

// ✅ Activity log type
export interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  target: string;
  details?: string;
  timestamp: Date;
}

// ✅ Props for RecentActivity
interface RecentActivityProps {
  logs?: ActivityLog[];   // optional pre-fetched logs
  loading?: boolean;      // optional loading state if logs provided
  limitCount?: number;    // optional limit, default 5
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  logs: propLogs,
  loading: propLoading,
  limitCount = 5,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Format timestamp to human-readable string
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // ✅ Fetch activities
  useEffect(() => {
    if (propLogs) {
      // Use provided logs if available
      const formattedLogs = propLogs.map((log: any) => ({
        id: log.id || '',
        userName: log.userName || log.user || 'Unknown User',
        action: log.action || '',
        target: log.target || '',
        details: log.details || log.description || '',
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp),
      }));
      setActivities(formattedLogs.slice(0, limitCount));
      setLoading(propLoading ?? false);
      return;
    }

    // Fetch from Firestore if no logs provided
    const q = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: ActivityLog[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            userName: data.userName || data.user || 'Unknown User',
            action: data.action || '',
            target: data.target || '',
            details: data.details || data.description || '',
            timestamp:
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate()
                : new Date(data.timestamp),
          };
        });
        setActivities(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to fetch recent activities:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [propLogs, propLoading, limitCount]);

  // ✅ Loading placeholder
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(limitCount)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ Render activity list
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No recent activity
            </p>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{String(activity.userName)}</span> {String(activity.action)} {String(activity.target)}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{String(activity.details)}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
