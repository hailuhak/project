import React, { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { User } from "../../../types";
import { db, auth } from "../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  updateEmail,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from "firebase/auth";

interface ProfileProps {
  currentUser: User | null;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [role] = useState(
    currentUser?.role === "user" ? "General User" : currentUser?.role || "Unknown"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Re-authentication state
  const [showReauth, setShowReauth] = useState(false);
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    if (!currentUser || !auth.currentUser) return;
    setLoading(true);

    try {
      const userRef = doc(db, "users", currentUser.uid || currentUser.id);

      // ✅ Update displayName in Firebase Auth
      if (displayName !== currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }

      // ✅ Update email if changed
      if (email !== currentUser.email) {
        try {
          await updateEmail(auth.currentUser, email);

          // Send verification email
          await sendEmailVerification(auth.currentUser);
          alert("📧 Verification email sent! Please check your inbox.");

        } catch (error: any) {
          if (error.code === "auth/requires-recent-login") {
            setShowReauth(true);
            setLoading(false);
            return;
          }
          throw error;
        }
      }

      // ✅ Update Firestore user document
      await updateDoc(userRef, { displayName, email });

      alert("✅ Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReauth = async () => {
    if (!auth.currentUser?.email) return;
    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Retry saving after re-authentication
      setShowReauth(false);
      setPassword("");
      await handleSave();
    } catch (err: any) {
      console.error("Re-authentication failed:", err);
      alert("❌ Re-authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account information and preferences
        </p>
      </header>

      {/* Profile + Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <CardContent className="flex flex-col items-center text-center p-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-white" />
            </div>

            {/* Name */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {displayName || "User"}
            </h3>

            {/* Role */}
            <span className="mt-3 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {role}
            </span>

            {/* Edit Button */}
            <Button
  className={`w-full mt-6 px-4 py-2 rounded-lg font-medium transition-colors
    ${isEditing 
      ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" 
      : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
    }`}
  onClick={() => setIsEditing(!isEditing)}
>
  {isEditing ? "Cancel" : "Edit Profile"}
</Button>

          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Information
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <Input value={role} disabled />
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Re-authentication Modal */}
      {showReauth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Re-authentication Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please re-enter your password to confirm this change.
            </p>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReauth(false)}>
                Cancel
              </Button>
              <Button onClick={handleReauth} disabled={loading}>
                {loading ? "Verifying..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
