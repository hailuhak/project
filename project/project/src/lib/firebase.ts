import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';  // ✅ Add this

const firebaseConfig = {
  apiKey: "AIzaSyBU6HipDksBICVVD0sMEs2HvpEoX-wobvs",
  authDomain: "atms-project-29933.firebaseapp.com",
  projectId: "atms-project-29933",
  storageBucket: "atms-project-29933.firebasestorage.app",
  messagingSenderId: "1009805799311",
  appId: "1:1009805799311:web:94e43c6089cd1b23af25fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);  // ✅ Export functions

export default app;
