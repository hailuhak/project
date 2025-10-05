import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthPageProps {
  onBack: () => void;
}

type Role = 'admin' | 'trainer' | 'trainee' | 'pending';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: Role;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canSignup, setCanSignup] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'trainee',
  });

  const { login, signup } = useAuth();

  // Registration session check
  useEffect(() => {
    if (isLogin) return;

    const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCanSignup(false);
        setRegistrationMessage('No active registration session available.');
        return;
      }

      const sessionData = snapshot.docs[0].data();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const regStart = new Date(sessionData.regStart);
      const regEnd = new Date(sessionData.regEnd);
      regStart.setHours(0, 0, 0, 0);
      regEnd.setHours(23, 59, 59, 999);

      if (today >= regStart && today <= regEnd) {
        setCanSignup(true);
        setRegistrationMessage('');
      } else if (today < regStart) {
        setCanSignup(false);
        setRegistrationMessage(`Registration opens on ${sessionData.regStart}`);
      } else {
        setCanSignup(false);
        setRegistrationMessage(`Registration closed on ${sessionData.regEnd}`);
      }
    });

    return () => unsubscribe();
  }, [isLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'role' ? (e.target.value as Role) : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        if (formData.password.length < 6) throw new Error('Password must be at least 6 characters long');
        await signup(formData.email, formData.password, formData.displayName, formData.role);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const handleGoogleSignIn = async () => {
  if (isLogin) {
    setError('Google sign-in is only available during signup. Please use email/password to login.');
    return;
  }

  if (!canSignup) {
    setError('Registration is not currently available.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email,
        role: 'pending',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      await setDoc(doc(db, 'pendingUsers', user.uid), {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email,
        role: 'trainee',
        photoURL: user.photoURL || '',
        timestamp: serverTimestamp(),
      });

      setError('Your account is pending approval. Please wait for admin approval.');
      return;
    }

    const userData = userSnap.data();
    if (userData.role === 'pending') {
      setError('Your account is still pending approval. Waiting for admin.');
      return;
    }

  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Welcome
        </motion.button>

        {/* Auth Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? 'Sign in to access your dashboard' : 'Join ATMS to start your training journey'}
            </p>
          </div>

          {error && (
            <motion.div
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <Input
                label="Full Name"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            )}

            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isLogin && (
              <>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="trainee">Trainee</option>
                  </select>
                </div>
              </>
            )}

            {!isLogin && !canSignup && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg mb-4">
                {registrationMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!isLogin && !canSignup}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleGoogleSignIn} disabled={loading}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.19-2.37H12v4.49h6.44c-.28 1.53-1.13 2.82-2.38 3.69v3.06h3.84c2.25-2.07 3.55-5.13 3.55-8.87z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.92-2.89l-3.84-3.06c-1.05.7-2.41 1.12-4.08 1.12-3.15 0-5.81-2.13-6.77-5H2.18v3.06C4.13 21.87 7.91 24 12 24z"/>
              <path fill="#FBBC05" d="M5.23 14.18c-.25-.76-.4-1.57-.4-2.43 0-.86.15-1.67.4-2.43v-3.06H2.18C1.57 8.44 1.17 10.11 1.17 12s.4 3.56 1.01 5.31l3.05-2.13z"/>
              <path fill="#EA4335" d="M12 5.38c1.66 0 3.13.57 4.31 1.66l3.22-3.22C17.85 2.08 15.29 1 12 1 7.91 1 4.13 3.13 2.18 7.07l3.05 2.13c.96-2.87 3.62-4.82 6.77-4.82z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
