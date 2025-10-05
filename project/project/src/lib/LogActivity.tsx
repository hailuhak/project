// utils/logActivity.ts
import { db, auth } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/**
 * Logs a user activity into Firestore
 * @param action - What the user did (e.g., "Updated Profile")
 * @param target - Optional target (e.g., "Profile Page")
 * @param details - Optional extra details
 */
export const logActivity = async (
  action: string,
  target: string = "",
  details: string = ""
) => {
  try {
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email || "Unknown User";

    await addDoc(collection(db, "activityLogs"), {
      userName, // Note: keep "userName" consistent with your collection
      action,
      target,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
