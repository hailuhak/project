import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: GraduationCap,
      title: 'Professional Training',
      description: 'Access high-quality audit training programs designed by industry experts.',
    },
    {
      icon: Users,
      title: 'Expert Instructors',
      description: 'Learn from certified professionals with years of real-world experience.',
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Resources',
      description: 'Get access to extensive learning materials and practice exercises.',
    },
    {
      icon: Award,
      title: 'Certification',
      description: 'Earn recognized certifications upon successful completion of courses.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <GraduationCap className="w-8 h-8" />
          </motion.div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Audit Training
            <span className="block text-blue-600 dark:text-blue-400">
              Management System
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Streamline your audit training programs with our comprehensive management system. 
            Create, manage, and track training sessions with ease while ensuring compliance and excellence.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="px-8 py-4 text-lg"
            >
              Get Started Today
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-8 sm:p-12 text-center text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Training?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using ATMS to deliver exceptional audit training programs.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={onGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            >
              Start Your Journey
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};