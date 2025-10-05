import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hop as Home, BookOpen, Users, Calendar, BarChart as BarChart3, FileText, UserCheck, GraduationCap, Monitor, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allMenuItems = [
    { id: 'dashboard', label: 'Home', icon: Home },

    { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'pending-users', label: 'Pending Users', icon: UserCheck, roles: ['admin'] },
    { id: 'courses', label: 'Course Management', icon: BookOpen, roles: ['admin'] },
    { id: 'sessions', label: 'Sessions', icon: Calendar, roles: ['admin'] },
    { id: 'grades', label: 'Grades', icon: BarChart3, roles: ['admin'] },
    { id: 'activities', label: 'Activity Logs', icon: FileText, roles: ['admin'] },

    { id: 'courses', label: 'My Courses', icon: BookOpen, roles: ['trainer'] },
    { id: 'sessions', label: 'Training Sessions', icon: Calendar, roles: ['trainer'] },
    { id: 'attendance', label: 'Attendance', icon: UserCheck, roles: ['trainer'] },
    { id: 'materials', label: 'Materials', icon: FileText, roles: ['trainer'] },

    { id: 'courses', label: 'My Courses', icon: GraduationCap, roles: ['trainee'] },
    { id: 'progress', label: 'Progress', icon: BarChart3, roles: ['trainee'] },
    { id: 'schedule', label: 'Schedule', icon: Calendar, roles: ['trainee'] },
    { id: 'resources', label: 'Resources', icon: FileText, roles: ['trainee'] },
    { id: 'elearning', label: 'E-Learning', icon: Monitor, roles: ['trainee'] },

    { id: 'courses', label: 'Browse Courses', icon: BookOpen, roles: ['pending'] },
    { id: 'profile', label: 'Profile', icon: Users, roles: ['pending'] },
  ];

  const role = currentUser?.role || 'pending';
  const menuItems = allMenuItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <>
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded shadow"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.aside
            className="fixed lg:static top-0 left-0 z-50 w-56 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen"
            initial={{ x: isMobile ? -300 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -300 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-6 flex flex-col h-full">
              {isMobile && (
                <div className="flex justify-end mb-4">
                  <button onClick={() => setIsOpen(false)} className="text-gray-700 dark:text-gray-200">
                    <X size={24} />
                  </button>
                </div>
              )}

              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      if (isMobile) setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors',
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {(!isMobile || isOpen) && <span>{item.label}</span>}
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
