import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { AdminDashboard } from './dashboards/AdminDashbored/AdminDashboard';
import { TraineeDashboard } from './dashboards/TraineeDashbord/TraineeDashboard';
import { TrainerDashboard } from './dashboards/TrainerDashbord/TrainerDashbord';
import { UserDashboard } from './dashboards/AllUserDashbord/UserDashboard';
import { PendingUsers } from './dashboards/AdminDashbored/PendingUsers';

import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

export const Dashboard: React.FC = () => {
  const { currentUser: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(authUser);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUser(docSnap.data() as User);
      }
    });

    return () => unsubscribe();
  }, [authUser?.uid]);

  const getDashboardComponent = () => {
    if (!currentUser) return null;

    if (!currentUser.role || currentUser.role === 'pending') {
      return (
        <div className="space-y-4">
          <UserDashboard activeSection={activeSection} />
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
            Your account is pending admin approval.
          </div>
        </div>
      );
    }

    switch (currentUser.role) {
      case 'admin':
        switch (activeSection) {
          case 'pending-users':
            return <PendingUsers />;
          default:
            return <AdminDashboard activeSection={activeSection} />;
        }

      case 'trainer':
        return <TrainerDashboard activeSection={activeSection} />;

      case 'trainee':
        return <TraineeDashboard activeSection={activeSection} />;

      default:
        return <UserDashboard activeSection={activeSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <motion.main 
          className="flex-1 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {getDashboardComponent()}
        </motion.main>
      </div>
    </div>
  );
};
