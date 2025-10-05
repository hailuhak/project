import React, { useState } from 'react';
import { WelcomePage } from './pages/WelcomePage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from "react-hot-toast";  // ✅ correct import
import './index.css';

const AppContent: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Dashboard />;
  }

  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  return <WelcomePage onGetStarted={() => setShowAuth(true)} />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <AppContent />
          {/* ✅ Add Toaster here so it works globally */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#333",
                color: "#fff",
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
