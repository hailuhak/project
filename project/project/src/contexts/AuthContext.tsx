import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import { FieldValue } from 'firebase/firestore';

interface UserWithTimestamp extends User {
  timestamp?: FieldValue;
}

interface AuthContextType {
  currentUser: UserWithTimestamp | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string,
    selectedRole: 'user' | 'trainer' | 'trainee'
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  approveUser?: (userId: string) => Promise<void>;
  rejectUser?: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserWithTimestamp | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Signup ---
  const signup = async (
    email: string,
    password: string,
    displayName: string,
    selectedRole: 'user' | 'trainer' | 'trainee'
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });

    const userData: UserWithTimestamp = {
      uid: result.user.uid,
      email,
      displayName,
      role: 'pending', // always pending in users collection
      photoURL: result.user.photoURL || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      timestamp: serverTimestamp(), // server timestamp
    };

    // --- Store in users collection with pending role ---
    await setDoc(doc(db, 'users', result.user.uid), userData);

    // --- Store in pendingUsers collection with selected role ---
    await setDoc(doc(db, 'pendingUsers', result.user.uid), {
      uid: result.user.uid,
      email,
      displayName,
      role: selectedRole, // role chosen by user
      photoURL: result.user.photoURL || '',
      timestamp: serverTimestamp(),
    });

    setCurrentUser(userData); // allow dashboard render immediately
  };

  // --- Login ---
  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: UserWithTimestamp = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        role: 'pending',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        timestamp: serverTimestamp(),
      };
      await setDoc(userRef, newUser);
      setCurrentUser(newUser);
      return;
    }

    const userData = userDoc.data() as UserWithTimestamp;
    await setDoc(userRef, { ...userData, lastLogin: new Date() }, { merge: true });
    setCurrentUser(userData);
  };

  // --- Login with Google ---
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const userRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: UserWithTimestamp = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        role: 'pending',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        timestamp: serverTimestamp(),
      };
      await setDoc(userRef, newUser);

      await setDoc(doc(db, 'pendingUsers', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        role: 'trainee',
        photoURL: result.user.photoURL || '',
        timestamp: serverTimestamp(),
      });

      setCurrentUser(newUser);
      return;
    }

    const userData = userDoc.data() as UserWithTimestamp;
    await setDoc(userRef, { ...userData, lastLogin: new Date() }, { merge: true });
    setCurrentUser(userData);
  };

  // --- Logout ---
  const logout = async () => await signOut(auth);

  // --- Admin approves user ---
  const approveUser = async (userId: string) => {
    const pendingRef = doc(db, 'pendingUsers', userId);
    const pendingDoc = await getDoc(pendingRef);
    if (!pendingDoc.exists()) return;

    const pendingData = pendingDoc.data();
    if (pendingData) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { ...pendingData, lastLogin: new Date() }, { merge: true });
      await deleteDoc(pendingRef); // remove from pendingUsers after approval
    }
  };

  // --- Admin rejects user ---
  const rejectUser = async (userId: string) => {
    await deleteDoc(doc(db, 'pendingUsers', userId));
    await deleteDoc(doc(db, 'users', userId)); // optionally remove from users collection too
  };

  // --- Auth state observer ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as UserWithTimestamp);
        } else {
          const newUser: UserWithTimestamp = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'pending',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date(),
            lastLogin: new Date(),
            timestamp: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    logout,
    loading,
    approveUser,
    rejectUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
