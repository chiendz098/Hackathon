import React from 'react';

const PetCompanion = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pet Companion
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your AI-powered study companion
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Pet Companion functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PetCompanion; 