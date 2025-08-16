import React from 'react';
import LearningAnalyticsDashboard from '../components/analytics/LearningAnalyticsDashboard';

const LearningAnalytics = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Learning Analytics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your learning progress and insights
          </p>
        </div>
        
        <LearningAnalyticsDashboard />
      </div>
    </div>
  );
};

export default LearningAnalytics; 