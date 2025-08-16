import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  XCircle
} from 'lucide-react';

const AnalyticsDashboard = ({ todos }) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.status === 'done').length,
      pending: todos.filter(t => t.status === 'pending' || !t.status).length,
      cancelled: todos.filter(t => t.status === 'cancelled').length,
      overdue: todos.filter(t => 
        t.status !== 'done' && 
        t.status !== 'cancelled' && 
        t.deadline && 
        new Date(t.deadline) < now
      ).length,
      
      // Time stats
      totalTimeSpent: todos.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
      totalEstimated: todos.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
      
      // Period stats
      todayCompleted: todos.filter(t => 
        t.status === 'done' && 
        t.completedAt && 
        new Date(t.completedAt) >= today
      ).length,
      weekCompleted: todos.filter(t => 
        t.status === 'done' && 
        t.completedAt && 
        new Date(t.completedAt) >= thisWeek
      ).length,
      monthCompleted: todos.filter(t => 
        t.status === 'done' && 
        t.completedAt && 
        new Date(t.completedAt) >= thisMonth
      ).length,

      // Status distribution
      statusDistribution: {
        pending: todos.filter(t => t.status === 'pending' || !t.status).length,
        done: todos.filter(t => t.status === 'done').length,
        cancelled: todos.filter(t => t.status === 'cancelled').length,
      },

      // Priority distribution
      priorityDistribution: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length,
      },

      // Category distribution
      categoryDistribution: todos.reduce((acc, todo) => {
        const category = todo.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),

      // Completion rate
      completionRate: todos.length > 0 ? Math.round((todos.filter(t => t.status === 'done').length / todos.length) * 100) : 0,

      // Average completion time
      avgCompletionTime: (() => {
        const completedTodos = todos.filter(t => t.status === 'done' && t.completedAt);
        if (completedTodos.length === 0) return 0;
        
        const totalTime = completedTodos.reduce((sum, t) => {
          const completionTime = new Date(t.completedAt) - new Date(t.createdAt);
          return sum + completionTime;
        }, 0);
        
        return Math.floor(totalTime / completedTodos.length / (1000 * 60)); // Convert to minutes
      })(),
    };

    return stats;
  }, [todos]);

  const statusConfig = {
    pending: { color: 'gray', icon: <AlertCircle className="w-4 h-4" />, label: 'Pending' },
    done: { color: 'green', icon: <CheckCircle className="w-4 h-4" />, label: 'Done' },
    cancelled: { color: 'red', icon: <XCircle className="w-4 h-4" />, label: 'Cancelled' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Tổng quan công việc
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-3xl font-bold">{analytics.total}</div>
            <div className="text-sm text-gray-500">Tổng số công việc</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-green-500">{analytics.completed}</div>
            <div className="text-sm text-gray-500">Đã hoàn thành</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-blue-500">{analytics.inProgress}</div>
            <div className="text-sm text-gray-500">Đang thực hiện</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-red-500">{analytics.overdue}</div>
            <div className="text-sm text-gray-500">Quá hạn</div>
          </div>
        </div>
        
        {/* Completion Rate */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tỷ lệ hoàn thành</span>
            <span className="text-sm font-bold text-green-600">{analytics.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${analytics.completionRate}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Phân bố trạng thái
        </h2>
        <div className="space-y-3">
          {Object.entries(analytics.statusDistribution).map(([status, count]) => {
            const config = statusConfig[status];
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-${config.color}-500`}>{config.icon}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Time Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Thời gian
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Tổng thời gian đã dùng</div>
            <div className="text-2xl font-bold">{Math.floor(analytics.totalTimeSpent / 60)}h {analytics.totalTimeSpent % 60}m</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Thời gian dự kiến</div>
            <div className="text-2xl font-bold">{Math.floor(analytics.totalEstimated / 60)}h {analytics.totalEstimated % 60}m</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Thời gian trung bình hoàn thành</div>
            <div className="text-2xl font-bold">{analytics.avgCompletionTime}m</div>
          </div>
        </div>
      </motion.div>

      {/* Progress Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tiến độ
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Hoàn thành hôm nay</div>
            <div className="text-2xl font-bold text-green-600">{analytics.todayCompleted}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Hoàn thành tuần này</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.weekCompleted}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Hoàn thành tháng này</div>
            <div className="text-2xl font-bold text-purple-600">{analytics.monthCompleted}</div>
          </div>
        </div>
      </motion.div>

      {/* Priority Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Phân bố ưu tiên
        </h2>
        <div className="space-y-3">
          {Object.entries(analytics.priorityDistribution).map(([priority, count]) => {
            const priorityColors = {
              critical: 'text-red-600',
              high: 'text-orange-600',
              medium: 'text-yellow-600',
              low: 'text-green-600'
            };
            return (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{priority}</span>
                <span className={`font-semibold ${priorityColors[priority]}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Category Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Phân bố danh mục
        </h2>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {Object.entries(analytics.categoryDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
