import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react'; // Import the type
import { Card, CardContent } from '../ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon; // ✅ Proper type for icon component
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  const changeColors: Record<string, string> = {
    increase: 'text-emerald-600 dark:text-emerald-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Text Section */}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              {change && (
                <p className={`text-sm ${changeColors[changeType]} mt-1`}>
                  {changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : ''}
                  {change}
                </p>
              )}
            </div>

            {/* Icon Section */}
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
