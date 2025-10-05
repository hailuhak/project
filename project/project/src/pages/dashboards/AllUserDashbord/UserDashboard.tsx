
import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardOverview } from './DashboardOverview';
import { BrowseCourses } from './BrowseCourses';
import { Profile } from './Profile';

interface UserDashboardProps {
  activeSection: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ activeSection }) => {
  const { currentUser } = useAuth();

  switch (activeSection) {
    case 'courses':
      return <BrowseCourses currentUser={currentUser} />;
    case 'profile':
      return <Profile currentUser={currentUser} />;
    default:
      return <DashboardOverview currentUser={currentUser} />;
  }
};
