import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// 🔑 Load Gmail credentials from Firebase config
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

if (!gmailEmail || !gmailPassword) {
  throw new Error("❌ Gmail credentials not set in Firebase config.");
}

// ✉️ Create transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 📦 Data shape from frontend
interface UserActionData {
  pendingUserId: string;
  to_name: string;
  to_email: string;
  message: string;
  action: "approve" | "reject" | "edit" | "delete";
}

// 🚀 Callable Function
export const handleUserAction = functions.https.onCall(
  async (request: functions.https.CallableRequest<UserActionData>) => {
    const { pendingUserId, to_name, to_email, message, action } = request.data;

    // 1️⃣ Auth check
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to perform this action."
      );
    }

    // 2️⃣ Role check (only admins allowed)
    if (request.auth.token.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can perform this action."
      );
    }

    if (!pendingUserId || !to_name || !to_email || !action) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields."
      );
    }

    try {
      // 3️⃣ Always send email
      await transporter.sendMail({
        from: `Your Platform <${gmailEmail}>`,
        to: to_email,
        subject: `Your account has been ${action}`,
        text: `Hello ${to_name},

Your account has been ${action} by the admin.

Message: ${message}

Thank you!`,
      });

      const pendingUserRef = admin.firestore().collection("pendingUsers").doc(pendingUserId);
      const userRef = admin.firestore().collection("users").doc(pendingUserId);

      // 4️⃣ Handle actions
      if (action === "approve") {
        const snap = await pendingUserRef.get();
        if (!snap.exists) {
          throw new functions.https.HttpsError("not-found", "Pending user not found.");
        }
        const userData = snap.data();

        await userRef.set({
          ...userData,
          role: userData?.requestedRole || "user",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await pendingUserRef.delete();
      }

      if (action === "reject") {
        const snap = await pendingUserRef.get();
        if (!snap.exists) {
          throw new functions.https.HttpsError("not-found", "Pending user not found.");
        }
        const userData = snap.data();

        await admin.firestore().collection("rejectedUsers").doc(pendingUserId).set({
          ...userData,
          rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await pendingUserRef.delete();
      }
if (action === "edit") {
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "User not found in Firestore.");
  }

  const updateData: admin.auth.UpdateRequest = {};
  if (to_name) updateData.displayName = to_name;
  if (to_email) updateData.email = to_email;

  const firestoreUpdate: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (to_name) firestoreUpdate.displayName = to_name;
  if (to_email) firestoreUpdate.email = to_email;

  // Run both updates together
  await Promise.all([
    userRef.update(firestoreUpdate),
    admin.auth().updateUser(pendingUserId, updateData).catch((err) => {
      if (err.code === "auth/user-not-found") {
        throw new functions.https.HttpsError("not-found", "User not found in Auth.");
      }
      throw err;
    }),
  ]);
}
if (action === "delete") {
  const firestoreDelete = userRef.delete().catch((err) => {
    console.error("Firestore delete failed:", err);
  });

  const authDelete = admin.auth().deleteUser(pendingUserId).catch((err) => {
    if (err.code === "auth/user-not-found") {
      console.warn("User not found in Auth, skipping.");
      return;
    }
    throw err;
  });

  await Promise.all([firestoreDelete, authDelete]);
}


      return {
        success: true,
        message: `✅ User ${action} action completed successfully.`,
      };
    } catch (error: any) {
      console.error("❌ Error in handleUserAction:", error);
      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Something went wrong"
      );
    }
  }
);
