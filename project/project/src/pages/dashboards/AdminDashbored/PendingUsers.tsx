import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { CheckCircle, Circle as XCircle, Clock } from "lucide-react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

interface PendingUser {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  timestamp?: any;
}

export const PendingUsers: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");

  // 🔹 Load pending users in real-time
  useEffect(() => {
    const q = query(collection(db, "pendingUsers"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as PendingUser[];
      setPendingUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Activity log helper
  const addActivityLog = async (
    action: "approved" | "rejected",
    targetUser: PendingUser,
    message?: string
  ) => {
    try {
      await setDoc(doc(collection(db, "activityLogs")), {
        userName: auth.currentUser?.displayName || "Admin",
        action,
        target: targetUser.displayName,
        targetEmail: targetUser.email,
        message: message || "",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  // 🔹 Approve user
  const handleApprove = async () => {
    if (!selectedUser) return;

    setActioningUserId(selectedUser.uid);

    try {
      const pendingRef = doc(db, "pendingUsers", selectedUser.uid);
      const pendingDoc = await getDoc(pendingRef);
      if (!pendingDoc.exists()) throw new Error("User not found");

      const pendingData = pendingDoc.data();
      const userRef = doc(db, "users", selectedUser.uid);

      // Update user's role
      await updateDoc(userRef, {
        role: pendingData.role,
        approvedAt: new Date(),
      });

      // Delete from pending
      await deleteDoc(pendingRef);

      // Log activity
      await addActivityLog("approved", selectedUser, approvalMessage);

      // Send email via cloud function
      const functions = getFunctions();
      const sendEmail = httpsCallable(functions, "handleUserAction");
      try {
        await sendEmail({
          pendingUserId: selectedUser.uid,
          to_name: selectedUser.displayName,
          to_email: selectedUser.email,
          message:
            approvalMessage ||
            "Your account has been approved. You can now access the system.",
          action: "approve",
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      alert(`User ${selectedUser.displayName} approved successfully!`);
      setShowApprovalForm(false);
      setSelectedUser(null);
      setApprovalMessage("");
    } catch (error: any) {
      console.error("Error approving user:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setActioningUserId(null);
    }
  };

  // 🔹 Reject user
  const handleReject = async () => {
    if (!selectedUser) return;

    setActioningUserId(selectedUser.uid);

    try {
      const pendingRef = doc(db, "pendingUsers", selectedUser.uid);
      await deleteDoc(pendingRef);

      const userRef = doc(db, "users", selectedUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) await deleteDoc(userRef);

      // Log activity
      await addActivityLog("rejected", selectedUser, rejectionMessage);

      // Send email via cloud function
      const functions = getFunctions();
      const sendEmail = httpsCallable(functions, "handleUserAction");
      try {
        await sendEmail({
          pendingUserId: selectedUser.uid,
          to_name: selectedUser.displayName,
          to_email: selectedUser.email,
          message: rejectionMessage || "Your account registration has been rejected.",
          action: "reject",
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      alert(`User ${selectedUser.displayName} rejected.`);
      setShowRejectionForm(false);
      setSelectedUser(null);
      setRejectionMessage("");
    } catch (error: any) {
      console.error("Error rejecting user:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setActioningUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pending User Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve or reject new user registrations
        </p>
      </div>

      {/* Approval Form */}
      {showApprovalForm && selectedUser && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Approve {selectedUser.displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: {selectedUser.email} | Role: {selectedUser.role}
            </p>
            <textarea
              value={approvalMessage}
              onChange={(e) => setApprovalMessage(e.target.value)}
              placeholder="Enter a message for the user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={!!actioningUserId}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Approval
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalForm(false);
                  setSelectedUser(null);
                  setApprovalMessage("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Form */}
      {showRejectionForm && selectedUser && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reject {selectedUser.displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: {selectedUser.email} | Role: {selectedUser.role}
            </p>
            <textarea
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={!!actioningUserId}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionForm(false);
                  setSelectedUser(null);
                  setRejectionMessage("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Loading pending users...
            </p>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Requested Role</th>
                    <th className="px-4 py-2">Submitted At</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.uid} className="border-b dark:border-gray-600">
                      <td className="px-4 py-2">{user.displayName}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {user.timestamp?.toDate
                          ? user.timestamp.toDate().toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowApprovalForm(true);
                            setShowRejectionForm(false);
                          }}
                          disabled={actioningUserId === user.uid}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRejectionForm(true);
                            setShowApprovalForm(false);
                          }}
                          disabled={actioningUserId === user.uid}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
