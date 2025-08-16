import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            About
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Learn more about our learning platform
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-600 dark:text-gray-300">
            About page content coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default About; 