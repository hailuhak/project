import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';

export const activityService = {
  async logActivity(
    userId: string, 
    userName: string, 
    action: string, 
    target: string, 
    details: string
  ) {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      userName,
      action,
      target,
      details,
      timestamp: new Date(),
    });
  },

  async getRecentActivities(limitCount = 10) {
    const q = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as ActivityLog[];
  },

  async getUserActivities(userId: string, limitCount = 20) {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as ActivityLog[];
  }
};
