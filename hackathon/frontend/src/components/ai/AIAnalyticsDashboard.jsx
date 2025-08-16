import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AIAnalyticsDashboard = () => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [monthlyReport, setMonthlyReport] = useState({
    period: 'November 2024',
    totalTasksCompleted: 156,
    totalStudyHours: 89.5,
    averageProductivity: 82,
    topSubject: 'Programming',
    achievements: [
      '🏆 Completed 20+ tasks in Programming',
      '⚡ Maintained 7-day study streak',
      '📈 Improved focus score by 15%',
      '🎯 Achieved 85% task completion rate'
    ],
    insights: [
      'Your productivity peaks between 2-4 PM',
      'Math tasks take 20% longer than estimated',
      'You work best with 45-minute focused sessions',
      'Weekend study sessions are 30% less effective'
    ],
    recommendations: [
      'Schedule complex tasks during your peak hours (2-4 PM)',
      'Break down Math problems into smaller chunks',
      'Use the Pomodoro technique for optimal focus',
      'Consider lighter tasks for weekend study sessions'
    ]
  });

  useEffect(() => {
    fetchAnalytics();
    generateMonthlyReport();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/ai/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Failed to fetch analytics:', data.message);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const response = await fetch('/api/ai/monthly-report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setMonthlyReport(data.report);
      }
    } catch (error) {
      console.error('Error generating monthly report:', error);
      setMonthlyReport(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className={currentTheme === 'neon' ? 'text-white' : 'text-gray-600'}>
            Analyzing your learning patterns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            🧠 AI Learning Analytics
          </h2>
          <p className={`mt-1 ${
            currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Insights powered by artificial intelligence
          </p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            currentTheme === 'neon'
              ? 'bg-gray-800 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Study Consistency', 
            value: `${analytics?.studyConsistency?.score || 0}%`, 
            icon: '📊',
            trend: analytics?.studyConsistency?.trend || 'stable',
            color: 'blue'
          },
          { 
            label: 'Focus Score', 
            value: `${analytics?.productivityPatterns?.focusScore || 0}%`, 
            icon: '🎯',
            trend: 'improving',
            color: 'green'
          },
          { 
            label: 'Completion Rate', 
            value: `${analytics?.productivityPatterns?.completionRate || 0}%`, 
            icon: '✅',
            trend: 'stable',
            color: 'purple'
          },
          { 
            label: 'Avg Session', 
            value: `${analytics?.productivityPatterns?.averageSessionLength || 0}min`, 
            icon: '⏱️',
            trend: 'improving',
            color: 'orange'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {metric.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  {metric.value}
                </p>
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
            <div className={`mt-2 text-sm ${
              metric.trend === 'improving' ? 'text-green-500' :
              metric.trend === 'declining' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {metric.trend === 'improving' ? '↗️ Improving' :
               metric.trend === 'declining' ? '↘️ Declining' :
               '→ Stable'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Consistency Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-xl ${
            currentTheme === 'neon'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            📈 Weekly Study Pattern
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics?.studyConsistency?.weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={currentTheme === 'neon' ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="day" stroke={currentTheme === 'neon' ? '#9CA3AF' : '#6B7280'} />
              <YAxis stroke={currentTheme === 'neon' ? '#9CA3AF' : '#6B7280'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: currentTheme === 'neon' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${currentTheme === 'neon' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: currentTheme === 'neon' ? '#FFFFFF' : '#1F2937'
                }}
              />
              <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Learning Style Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-xl ${
            currentTheme === 'neon'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            🧠 Learning Style Analysis
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analytics?.learningStyle?.distribution || []}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {analytics?.learningStyle?.distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: currentTheme === 'neon' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${currentTheme === 'neon' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: currentTheme === 'neon' ? '#FFFFFF' : '#1F2937'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {analytics?.learningStyle?.distribution?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subject Engagement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl ${
          currentTheme === 'neon'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200 shadow-lg'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          📚 Subject Engagement Analysis
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics?.subjectEngagement || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={currentTheme === 'neon' ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="subject" stroke={currentTheme === 'neon' ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={currentTheme === 'neon' ? '#9CA3AF' : '#6B7280'} />
            <Tooltip 
              contentStyle={{
                backgroundColor: currentTheme === 'neon' ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${currentTheme === 'neon' ? '#374151' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: currentTheme === 'neon' ? '#FFFFFF' : '#1F2937'
              }}
            />
            <Bar dataKey="engagement" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Monthly Report */}
      {monthlyReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl ${
            currentTheme === 'neon'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            📋 Monthly AI Report - {typeof monthlyReport.period === 'string' ? monthlyReport.period : 'Current Period'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${
              currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                {monthlyReport?.totalTasksCompleted || 0}
              </div>
              <div className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Tasks Completed
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-green-400' : 'text-green-600'
              }`}>
                {monthlyReport?.totalStudyHours || 0}h
              </div>
              <div className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Study Hours
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {monthlyReport?.averageProductivity || 0}%
              </div>
              <div className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Avg Productivity
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {monthlyReport?.topSubject || 'N/A'}
              </div>
              <div className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Top Subject
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className={`font-semibold mb-3 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                🏆 Achievements
              </h4>
              <ul className="space-y-2">
                {(monthlyReport?.achievements || []).map((achievement, index) => (
                  <li key={index} className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-3 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                💡 Key Insights
              </h4>
              <ul className="space-y-2">
                {(monthlyReport?.insights || []).map((insight, index) => (
                  <li key={index} className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-3 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                🎯 Recommendations
              </h4>
              <ul className="space-y-2">
                {(monthlyReport?.recommendations || []).map((recommendation, index) => (
                  <li key={index} className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    • {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIAnalyticsDashboard;
