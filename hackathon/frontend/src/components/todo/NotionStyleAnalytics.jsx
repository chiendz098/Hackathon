import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Clock, Calendar, Target, 
  CheckCircle, AlertCircle, Clock3, Activity, Zap, Crown 
} from 'lucide-react';

const NotionStyleAnalytics = ({ todos, members, group, darkMode }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMember, setSelectedMember] = useState('all');

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filteredTodos = todos;
    
    // Filter by time range
    if (timeRange === 'week') {
      filteredTodos = todos.filter(todo => new Date(todo.createdAt) >= weekAgo);
    } else if (timeRange === 'month') {
      filteredTodos = todos.filter(todo => new Date(todo.createdAt) >= monthAgo);
    }

    // Filter by member
    if (selectedMember !== 'all') {
      filteredTodos = todos.filter(todo => 
        todo.assignments?.some(a => a.assignedTo === parseInt(selectedMember))
      );
    }

    const totalTodos = filteredTodos.length;
    const completedTodos = filteredTodos.filter(t => t.status === 'completed').length;
    const inProgressTodos = filteredTodos.filter(t => t.status === 'in_progress').length;
    const pendingTodos = filteredTodos.filter(t => t.status === 'pending').length;
    const overdueTodos = filteredTodos.filter(t => {
      if (!t.deadline) return false;
      return new Date(t.deadline) < now;
    }).length;

    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const averageProgress = totalTodos > 0 
      ? filteredTodos.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTodos 
      : 0;

    // Priority distribution
    const priorityDistribution = {
      low: filteredTodos.filter(t => t.priority === 'low').length,
      medium: filteredTodos.filter(t => t.priority === 'medium').length,
      high: filteredTodos.filter(t => t.priority === 'high').length,
      urgent: filteredTodos.filter(t => t.priority === 'urgent').length
    };

    // Category distribution
    const categoryDistribution = filteredTodos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1;
      return acc;
    }, {});

    // Member performance
    const memberPerformance = members.map(member => {
      const memberTodos = todos.filter(todo => 
        todo.assignments?.some(a => a.assignedTo === member.id)
      );
      const completed = memberTodos.filter(t => t.status === 'completed').length;
      const total = memberTodos.length;
      const performance = total > 0 ? (completed / total) * 100 : 0;
      
      return {
        id: member.id,
        name: member.name,
        totalTodos: total,
        completedTodos: completed,
        performance: performance,
        averageProgress: total > 0 
          ? memberTodos.reduce((sum, t) => sum + (t.progress || 0), 0) / total 
          : 0
      };
    });

    // Time tracking
    const totalEstimatedTime = filteredTodos.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
    const totalActualTime = filteredTodos.reduce((sum, t) => sum + (t.actualTime || 0), 0);
    const timeEfficiency = totalEstimatedTime > 0 
      ? ((totalEstimatedTime - totalActualTime) / totalEstimatedTime) * 100 
      : 0;

    return {
      totalTodos,
      completedTodos,
      inProgressTodos,
      pendingTodos,
      overdueTodos,
      completionRate,
      averageProgress,
      priorityDistribution,
      categoryDistribution,
      memberPerformance,
      totalEstimatedTime,
      totalActualTime,
      timeEfficiency
    };
  }, [todos, members, timeRange, selectedMember]);

  // Chart data for priority distribution
  const priorityChartData = [
    { label: 'Low', value: analytics.priorityDistribution.low, color: 'bg-blue-500' },
    { label: 'Medium', value: analytics.priorityDistribution.medium, color: 'bg-yellow-500' },
    { label: 'High', value: analytics.priorityDistribution.high, color: 'bg-orange-500' },
    { label: 'Urgent', value: analytics.priorityDistribution.urgent, color: 'bg-red-500' }
  ];

  // Chart data for category distribution
  const categoryChartData = Object.entries(analytics.categoryDistribution).map(([category, count]) => ({
    label: category,
    value: count,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your group's performance and progress</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time range filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          
          {/* Member filter */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Todos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalTodos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.completionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.averageProgress.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.overdueTodos}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {priorityChartData.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ 
                        width: `${analytics.totalTodos > 0 ? (item.value / analytics.totalTodos) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${analytics.totalTodos > 0 ? (analytics.completedTodos / analytics.totalTodos) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                  {analytics.completedTodos}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${analytics.totalTodos > 0 ? (analytics.inProgressTodos / analytics.totalTodos) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                  {analytics.inProgressTodos}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ 
                      width: `${analytics.totalTodos > 0 ? (analytics.pendingTodos / analytics.totalTodos) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                  {analytics.pendingTodos}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Member Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Member Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Total Todos</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Completed</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Performance</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {analytics.memberPerformance.map((member, index) => (
                <tr key={member.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{member.totalTodos}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{member.completedTodos}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.performance >= 80 ? 'bg-green-500' :
                            member.performance >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${member.performance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                        {member.performance.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {member.averageProgress.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Time Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(analytics.totalEstimatedTime / 60)}h {analytics.totalEstimatedTime % 60}m
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actual Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(analytics.totalActualTime / 60)}h {analytics.totalActualTime % 60}m
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
            <p className={`text-2xl font-bold ${
              analytics.timeEfficiency > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {analytics.timeEfficiency > 0 ? '+' : ''}{analytics.timeEfficiency.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotionStyleAnalytics; 