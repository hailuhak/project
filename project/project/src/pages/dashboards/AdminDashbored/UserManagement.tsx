import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  query,
  onSnapshot,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updateEmail,
} from "firebase/auth";

interface User {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  role: "trainee" | "trainer" | "admin" | "pending";
  createdAt?: Date;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "trainee" as "trainee" | "trainer" | "admin",
  });

  // 🔹 Real-time Firestore subscription
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate
          ? doc.data().createdAt.toDate()
          : new Date(),
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Activity log helper
  const addActivityLog = async (
    userName: string,
    action: string,
    target: string,
    details?: string
  ) => {
    try {
      await setDoc(doc(collection(db, "activityLogs")), {
        userName,
        action,
        target,
        details: details || "",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  // 🔹 Add User
  const handleAddUser = async () => {
    const { displayName, email, password, role } = newUser;
    if (!displayName || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    try {
      // Check if email already exists
      const userRef = collection(db, "users");
      const q = query(userRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("User with this email already exists!");
        return;
      }

      // Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      const userData: User = {
        uid,
        displayName,
        email,
        role: "pending",
        createdAt: new Date(),
      };

      // Save in Firestore users
      await setDoc(doc(db, "users", uid), {
        ...userData,
        lastLogin: new Date(),
        timestamp: serverTimestamp(),
      });

      // Save pending role separately
      await setDoc(doc(db, "pendingUsers", uid), {
        uid,
        displayName,
        email,
        role,
        timestamp: serverTimestamp(),
      });

      // Log activity
      await addActivityLog(
        auth.currentUser?.displayName || "Admin",
        "added",
        displayName,
        `Role requested: ${role}`
      );

      setNewUser({ displayName: "", email: "", password: "", role: "trainee" });
      setShowAddUserForm(false);
      alert("User added successfully (pending approval)!");
    } catch (err: any) {
      console.error("Error adding user:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // 🔹 Edit User
  const handleSaveEdit = async () => {
    if (!editingUser || !editingUser.id) return;

    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        displayName: editingUser.displayName,
        email: editingUser.email,
        role: editingUser.role,
      });

      // Update Firebase Auth if editing own email
      const currentUser = auth.currentUser;
      if (
        currentUser &&
        currentUser.uid === editingUser.uid &&
        currentUser.email !== editingUser.email
      ) {
        await updateEmail(currentUser, editingUser.email);
      }

      // Log activity
      await addActivityLog(
        auth.currentUser?.displayName || "Admin",
        "edited",
        editingUser.displayName,
        `Role updated to: ${editingUser.role}`
      );

      setEditingUser(null);
      alert("User updated successfully!");
    } catch (err: any) {
      console.error("Error updating user:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // 🔹 Delete User
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      if (!user.id) return;
      await deleteDoc(doc(db, "users", user.id));

      // Log activity
      await addActivityLog(
        auth.currentUser?.displayName || "Admin",
        "deleted",
        user.displayName
      );

      alert("User deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users and their roles
          </p>
        </div>
        <Button onClick={() => setShowAddUserForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showAddUserForm && (
        <Card>
          <CardContent className="space-y-4">
            <Input
              placeholder="Full Name"
              value={newUser.displayName}
              onChange={(e) =>
                setNewUser({ ...newUser, displayName: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
            <Input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  role: e.target.value as "trainee" | "trainer" | "admin",
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="trainee">Trainee</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleAddUser}>Save User</Button>
              <Button
                variant="outline"
                onClick={() => setShowAddUserForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Form */}
      {editingUser && (
        <Card>
          <CardContent className="space-y-4">
            <Input
              placeholder="Full Name"
              value={editingUser.displayName}
              onChange={(e) =>
                setEditingUser({ ...editingUser, displayName: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              value={editingUser.email}
              onChange={(e) =>
                setEditingUser({ ...editingUser, email: e.target.value })
              }
            />
            <select
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  role: e.target.value as "trainee" | "trainer" | "admin",
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="trainee">Trainee</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Created At</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id || user.uid}
                      className="border-b dark:border-gray-600"
                    >
                      <td className="px-4 py-2">{user.displayName || "N/A"}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td className="px-4 py-2">
                        {user.createdAt instanceof Date
                          ? user.createdAt.toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <Edit2
                          className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                          onClick={() => setEditingUser(user)}
                        />
                        <Trash2
                          className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                          onClick={() => handleDeleteUser(user)}
                        />
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
