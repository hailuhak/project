import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, LogOut, Settings, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Listen to pendingUsers collection
  React.useEffect(() => {
    const q = query(collection(db, 'pendingUsers'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

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

            {/* Left: Logo */}
            <div className="flex items-center">
              <motion.div className="flex-shrink-0" whileHover={{ scale: 1.05 }}>
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ATMS
                </h1>
              </motion.div>
            </div>

            {/* Right: Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-4">

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {notifications}
                    </span>
                  )}
                </div>
              </Button>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              {/* User Info (always visible) */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentUser?.displayName || currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser?.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <div className="lg:hidden flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-5 h-5" />
              </Button>

              {/* User Info (always visible on mobile) */}
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex flex-col p-4 space-y-2">
              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <div className="relative flex items-center">
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {notifications}
                    </span>
                  )}
                </div>
              </Button>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />} Theme
              </Button>
            </div>
          </div>
        )}
      </motion.nav>

      {/* Spacer to avoid overlapping content */}
      <div className="h-16" />
    </>
  );
};
