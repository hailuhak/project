import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, LogOut, Settings, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [pendingUsers, setPendingUsers] = useState<number>(0);
  const [trainerNotifications, setTrainerNotifications] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [userInfo, setUserInfo] = useState({ displayName: '', email: '' });
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Fetch pending users count
  useEffect(() => {
    const q = query(collection(db, 'pendingUsers'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingUsers(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeGrades = onSnapshot(collection(db, 'grades'), (gradesSnapshot) => {
      const unsubscribeFinal = onSnapshot(collection(db, 'finalGrade'), (finalSnapshot) => {
        const gradesByTrainee: { [key: string]: any } = {};
        const finalGradesByTrainee: { [key: string]: any } = {};

        gradesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const key = `${data.traineeId}_${data.courseId}`;
          gradesByTrainee[key] = data;
        });

        finalSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.courses && Array.isArray(data.courses)) {
            data.courses.forEach((course: any) => {
              const key = `${data.traineeId}_${course.courseId}`;
              finalGradesByTrainee[key] = true;
            });
          }
        });

        const unsavedCount = Object.keys(gradesByTrainee).filter(key => !finalGradesByTrainee[key]).length;
        const notificationSet = unsavedCount > 0 ? new Set(['admin']) : new Set();
        setTrainerNotifications(notificationSet);
      });

      return () => unsubscribeFinal();
    });

    return () => unsubscribeGrades();
  }, []);

  // Fetch current user info from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserInfo = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserInfo({ displayName: data.displayName || '', email: data.email || '' });
      }
      setLoadingInfo(false);
    };
    fetchUserInfo();
  }, [currentUser]);

  // Save updated user info
  const handleUpdateInfo = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: userInfo.displayName,
        email: userInfo.email,
      });
      alert('✅ User info updated successfully!');
      setSettingsOpen(false);
    } catch (error) {
      console.error('Failed to update user info:', error);
      alert('❌ Failed to update info. Try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const gradeCount = trainerNotifications.size;

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center">
              <motion.div className="flex-shrink-0" whileHover={{ scale: 1.05 }}>
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">ATMS</h1>
              </motion.div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(!settingsOpen)}>
                <Settings className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="sm">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {pendingUsers > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{pendingUsers}</span>
                  )}
                  {gradeCount > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{gradeCount}</span>
                  )}
                </div>
              </Button>

              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser?.displayName || currentUser?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role}</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Dropdown */}
        {settingsOpen && (
          <div className="absolute right-4 top-16 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-4 z-50">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Your Info</h3>
            {loadingInfo ? (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : (
              <>
                <div className="mb-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300">Display Name</label>
                  <input
                    type="text"
                    value={userInfo.displayName}
                    onChange={(e) => setUserInfo({ ...userInfo, displayName: e.target.value })}
                    className="w-full p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="w-full p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                  />
                </div>
                <Button variant="primary" size="sm" onClick={handleUpdateInfo} className="w-full mt-2">
                  Update Info
                </Button>
              </>
            )}
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex flex-col p-4 space-y-2">
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(!settingsOpen)}><Settings className="w-4 h-4 mr-2" /> Settings</Button>
              <Button variant="ghost" size="sm">
                <div className="relative flex items-center">
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                  {pendingUsers > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{pendingUsers}</span>}
                  {gradeCount > 0 && <span className="absolute -bottom-1 -right-2 bg-green-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{gradeCount}</span>}
                </div>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />} Theme
              </Button>
            </div>
          </div>
        )}
      </motion.nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};
