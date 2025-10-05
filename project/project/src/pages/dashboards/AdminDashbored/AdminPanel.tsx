import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface PendingUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string; // ✅ added
}

export const AdminPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const { approveUser, rejectUser } = useAuth();

  const fetchPendingUsers = async () => {
    const snapshot = await getDocs(collection(db, 'pendingUsers'));
    const users: PendingUser[] = [];
    snapshot.forEach((docSnap) =>
      users.push({ id: docSnap.id, ...(docSnap.data() as Omit<PendingUser, 'id'>) })
    );
    setPendingUsers(users);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id: string) => {
    if (!approveUser) return;
    await approveUser(id);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleReject = async (id: string) => {
    if (!rejectUser) return;
    await rejectUser(id);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Pending Users</h2>

      {pendingUsers.length === 0 ? (
        <p className="text-gray-400">No pending users.</p>
      ) : (
        <ul className="space-y-4">
          {pendingUsers.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between bg-gray-800 p-4 rounded-lg shadow-md"
            >
              {/* ✅ Show profile photo if available */}
              <div className="flex items-center space-x-4">
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full border border-gray-700"
                />
                <div>
                  <strong className="block">{user.displayName}</strong>
                  <span className="text-sm text-gray-400">{user.email}</span>
                  <p className="text-sm text-blue-400">Role: {user.role}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(user.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(user.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// vehi fbeb lkfc jybu