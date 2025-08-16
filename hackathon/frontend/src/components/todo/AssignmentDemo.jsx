import React from 'react';
import { Users, CheckCircle, Clock, Target, MessageCircle, ArrowRight } from 'lucide-react';

const AssignmentDemo = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎯 Todo Assignment System Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* How to Use */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900">Create a Todo</h4>
                  <p className="text-sm text-gray-600">Create a new todo in your group</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900">Click Assignment Icon</h4>
                  <p className="text-sm text-gray-600">Click the 👥 icon on any todo card</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900">Assign Tasks</h4>
                  <p className="text-sm text-gray-600">Assign specific tasks to team members</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-gray-900">Track Progress</h4>
                  <p className="text-sm text-gray-600">Monitor real-time progress and completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Individual task assignments</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Progress tracking per person</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">Real-time chat per todo</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Auto-completion when all tasks done</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">Time tracking and deadlines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Examples */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kanban Card Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Kanban Card</h4>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900 text-sm">Design Homepage</h5>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">2/3</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">2 assigned</span>
                    <span className="text-gray-500">2/3 done</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">John</span>
                      </div>
                      <span className="text-green-600">completed</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Sarah</span>
                      </div>
                      <span className="text-blue-600">in_progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* List View Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">List View</h4>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <h5 className="font-medium text-gray-900">Build API</h5>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">medium</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">Created by Admin • 3 assigned</div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-xs font-medium text-gray-700 mb-1">Assignments</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">Alex (Lead)</span>
                      <span className="text-green-600">completed</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">Mike (Member)</span>
                      <span className="text-blue-600">in_progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Manager Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Assignment Manager</h4>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">👥 Manage Assignments • 💬 Chat • 📊 Analytics</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Team Members</span>
                    <span className="text-blue-600">3 assigned</span>
                  </div>
                  <div className="text-xs text-gray-500">Real-time progress tracking</div>
                  <div className="text-xs text-gray-500">Individual task management</div>
                  <div className="text-xs text-gray-500">Auto-completion detection</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Click any todo card and look for the 👥 icon to start assigning tasks!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDemo; 