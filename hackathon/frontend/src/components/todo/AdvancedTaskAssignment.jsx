import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  BarChart3, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  Timer,
  X,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Filter3,
  PieChart,
  Activity,
  Zap,
  Star,
  Award,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckSquare,
  Square as SquareIcon,
  Circle,
  MinusCircle,
  PlusCircle,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare,
  GitBranchPlus,
  GitCommitPlus,
  GitPullRequestPlus,
  GitMergePlus,
  GitComparePlus,
  GitBranchMinus,
  GitCommitMinus,
  GitPullRequestMinus,
  GitMergeMinus,
  GitCompareMinus,
  UserCheck,
  UserX,
  UserCog,
  Shield,
  Crown,
  Briefcase,
  GraduationCap,
  Heart,
  Palette,
  Code,
  BookOpen,
  Camera,
  Music,
  Gamepad2,
  Utensils,
  Car,
  Plane,
  Train,
  Bus,
  Bike,
  Walk,
  Run,
  Swimming,
  Dumbbell,
  Yoga,
  Meditation,
  Sleep,
  Coffee,
  Wine,
  Beer,
  Cocktail,
  Pizza,
  Hamburger,
  Sushi,
  IceCream,
  Cake,
  Cookie,
  Candy,
  Apple,
  Banana,
  Orange,
  Grape,
  Strawberry,
  Watermelon,
  Pineapple,
  Mango,
  Coconut,
  Avocado,
  Broccoli,
  Carrot,
  Potato,
  Tomato,
  Onion,
  Garlic,
  Ginger,
  Pepper,
  Salt,
  Sugar,
  Flour,
  Egg,
  Milk,
  Cheese,
  Butter,
  Oil,
  Vinegar,
  SoySauce,
  Ketchup,
  Mustard,
  Mayo,
  HotSauce,
  BBQ,
  Ranch,
  Caesar,
  ThousandIsland,
  BlueCheese,
  Italian,
  French,
  Asian,
  Mexican,
  Indian,
  Thai,
  Japanese,
  Chinese,
  Korean,
  Vietnamese,
  Thai,
  Indian,
  Italian,
  French,
  Spanish,
  German,
  British,
  American,
  Canadian,
  Australian,
  Brazilian,
  Argentine,
  Chilean,
  Peruvian,
  Colombian,
  Venezuelan,
  Ecuadorian,
  Bolivian,
  Paraguayan,
  Uruguayan,
  Guyanese,
  Surinamese,
  FrenchGuianese,
  FalklandIslander,
  SouthGeorgian,
  SouthSandwichIslander,
  Tristanian,
  SaintHelenian,
  AscensionIslander,
  GoughIslander,
  InaccessibleIslander,
  NightingaleIslander,
  MiddleIslander,
  StoltenhoffIslander,
  SouthAfrican,
  Namibian,
  Botswanan,
  Zimbabwean,
  Zambian,
  Malawian,
  Mozambican,
  Tanzanian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const AdvancedTaskAssignment = ({ todo, group, onAssignmentUpdate, onClose }) => {
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  
  // State management
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showWorkloadAnalysis, setShowWorkloadAnalysis] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  
  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    assignedTo: '',
    role: 'member',
    estimatedTime: '',
    dueDate: '',
    priority: 'medium',
    notes: '',
    permissions: {
      canEdit: true,
      canDelete: false,
      canReassign: false,
      canReview: false
    }
  });
  
  // Advanced features state
  const [workloadBalancing, setWorkloadBalancing] = useState(true);
  const [skillMatching, setSkillMatching] = useState(true);
  const [performanceTracking, setPerformanceTracking] = useState(true);
  const [autoAssignment, setAutoAssignment] = useState(false);
  
  // Performance metrics
  const [memberPerformance, setMemberPerformance] = useState({});
  const [workloadDistribution, setWorkloadDistribution] = useState({});
  const [skillMatrix, setSkillMatrix] = useState({});

  useEffect(() => {
    if (todo && group) {
      loadAssignmentData();
    }
  }, [todo, group]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      
      // Load group members
      const membersResponse = await get(`/groups/${group.id}/members`);
      if (membersResponse && membersResponse.data) {
        setMembers(membersResponse.data);
        setAvailableMembers(membersResponse.data.filter(m => 
          !assignments.some(a => a.assignedTo === m.id)
        ));
      }
      
      // Load existing assignments
      const assignmentsResponse = await get(`/todos/${todo.id}/assignments`);
      if (assignmentsResponse && assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
      }
      
      // Load performance data
      await loadPerformanceData();
      
    } catch (error) {
      console.error('Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Load member performance metrics
      const performanceResponse = await get(`/groups/${group.id}/members/performance`);
      if (performanceResponse && performanceResponse.data) {
        setMemberPerformance(performanceResponse.data);
      }
      
      // Load workload distribution
      const workloadResponse = await get(`/groups/${group.id}/workload`);
      if (workloadResponse && workloadResponse.data) {
        setWorkloadDistribution(workloadResponse.data);
      }
      
      // Load skill matrix
      const skillsResponse = await get(`/groups/${group.id}/skills`);
      if (skillsResponse && skillsResponse.data) {
        setSkillMatrix(skillsResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  // Assignment management
  const handleCreateAssignment = async () => {
    try {
      const response = await post('/todo-assignments', {
        todoId: todo.id,
        ...assignmentForm,
        assignedBy: user.id,
        status: 'pending'
      });
      
      if (response.success) {
        setAssignments(prev => [...prev, response.data]);
        setShowAddAssignment(false);
        setAssignmentForm({
          assignedTo: '',
          role: 'member',
          estimatedTime: '',
          dueDate: '',
          priority: 'medium',
          notes: '',
          permissions: {
            canEdit: true,
            canDelete: false,
            canReassign: false,
            canReview: false
          }
        });
        
        if (onAssignmentUpdate) {
          onAssignmentUpdate();
        }
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleUpdateAssignment = async (assignmentId, updates) => {
    try {
      const response = await put(`/todo-assignments/${assignmentId}`, updates);
      
      if (response.success) {
        setAssignments(prev => prev.map(a => 
          a.id === assignmentId ? { ...a, ...updates } : a
        ));
        
        if (onAssignmentUpdate) {
          onAssignmentUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const response = await del(`/todo-assignments/${assignmentId}`);
      
      if (response.success) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        
        if (onAssignmentUpdate) {
          onAssignmentUpdate();
        }
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  // Smart assignment suggestions
  const getSmartAssignmentSuggestions = () => {
    if (!workloadBalancing && !skillMatching) return [];
    
    const suggestions = [];
    
    members.forEach(member => {
      let score = 0;
      let reasons = [];
      
      // Workload balancing
      if (workloadBalancing) {
        const currentWorkload = workloadDistribution[member.id] || 0;
        const avgWorkload = Object.values(workloadDistribution).reduce((a, b) => a + b, 0) / Object.keys(workloadDistribution).length;
        
        if (currentWorkload < avgWorkload * 0.8) {
          score += 20;
          reasons.push('Low workload');
        } else if (currentWorkload > avgWorkload * 1.2) {
          score -= 10;
          reasons.push('High workload');
        }
      }
      
      // Skill matching
      if (skillMatching) {
        const memberSkills = skillMatrix[member.id] || {};
        const requiredSkills = todo.tags || [];
        
        const skillMatch = requiredSkills.filter(skill => 
          memberSkills[skill] && memberSkills[skill] >= 3
        ).length;
        
        if (skillMatch > 0) {
          score += skillMatch * 15;
          reasons.push(`${skillMatch} skills match`);
        }
      }
      
      // Performance history
      if (performanceTracking) {
        const performance = memberPerformance[member.id] || {};
        if (performance.completionRate > 0.9) {
          score += 15;
          reasons.push('High completion rate');
        }
        if (performance.avgQuality > 4) {
          score += 10;
          reasons.push('High quality work');
        }
      }
      
      if (score > 0) {
        suggestions.push({
          member,
          score,
          reasons
        });
      }
    });
    
    return suggestions.sort((a, b) => b.score - a.score);
  };

  // Auto-assignment
  const handleAutoAssignment = async () => {
    const suggestions = getSmartAssignmentSuggestions();
    
    if (suggestions.length === 0) {
      alert('No suitable members found for auto-assignment');
      return;
    }
    
    const bestMatch = suggestions[0];
    
    setAssignmentForm(prev => ({
      ...prev,
      assignedTo: bestMatch.member.id,
      notes: `Auto-assigned based on: ${bestMatch.reasons.join(', ')}`
    }));
    
    setShowAddAssignment(true);
  };

  // Role management
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'leader': return <Star className="h-4 w-4 text-purple-600" />;
      case 'reviewer': return <Eye className="h-4 w-4 text-green-600" />;
      case 'member': return <UserCheck className="h-4 w-4 text-gray-600" />;
      default: return <UserCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'leader': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reviewer': return 'bg-green-100 text-green-800 border-green-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Render methods
  const renderAssignmentForm = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowAddAssignment(false)}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Assign Task</h3>
            <button
              onClick={() => setShowAddAssignment(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Member
              </label>
              <select
                value={assignmentForm.assignedTo}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a member</option>
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={assignmentForm.role}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="leader">Leader</option>
                <option value="reviewer">Reviewer</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            {/* Time and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (hours)
                </label>
                <input
                  type="number"
                  value={assignmentForm.estimatedTime}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={assignmentForm.priority}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(assignmentForm.permissions).map(([permission, value]) => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setAssignmentForm(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [permission]: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {permission.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowAddAssignment(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAssignment}
              disabled={!assignmentForm.assignedTo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Task
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderWorkloadAnalysis = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowWorkloadAnalysis(false)}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Workload Analysis</h3>
            <button
              onClick={() => setShowWorkloadAnalysis(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Workload Distribution Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">Current Workload Distribution</h4>
              <div className="space-y-3">
                {members.map(member => {
                  const workload = workloadDistribution[member.id] || 0;
                  const maxWorkload = Math.max(...Object.values(workloadDistribution));
                  const percentage = maxWorkload > 0 ? (workload / maxWorkload) * 100 : 0;
                  
                  return (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="w-24 text-sm text-gray-600">{member.name}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            percentage > 80 ? 'bg-red-500' :
                            percentage > 60 ? 'bg-yellow-500' :
                            percentage > 40 ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">{workload} tasks</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Assignment Suggestions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-blue-900 mb-4">Smart Assignment Suggestions</h4>
              <div className="space-y-3">
                {getSmartAssignmentSuggestions().slice(0, 5).map((suggestion, index) => (
                  <div key={suggestion.member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">{suggestion.member.name}</div>
                        <div className="text-sm text-blue-700">{suggestion.reasons.join(', ')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{suggestion.score}</div>
                      <div className="text-xs text-blue-500">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-green-900 mb-4">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {members.map(member => {
                  const performance = memberPerformance[member.id] || {};
                  
                  return (
                    <div key={member.id} className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-900">{member.name}</div>
                      <div className="text-xs text-green-600 mt-1">
                        Completion: {((performance.completionRate || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600">
                        Quality: {performance.avgQuality || 'N/A'}/5
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Task Assignment Management</h2>
            <p className="text-sm text-gray-500">
              Manage task assignments for "{todo?.title}"
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowWorkloadAnalysis(true)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Workload Analysis</span>
            </button>
            
            <button
              onClick={handleAutoAssignment}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Smart Assign</span>
            </button>
            
            <button
              onClick={() => setShowAddAssignment(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={workloadBalancing}
              onChange={(e) => setWorkloadBalancing(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Workload Balancing</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={skillMatching}
              onChange={(e) => setSkillMatching(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Skill Matching</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={performanceTracking}
              onChange={(e) => setPerformanceTracking(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Performance Tracking</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoAssignment}
              onChange={(e) => setAutoAssignment(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto Assignment</span>
          </label>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
        
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No assignments yet. Assign tasks to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => {
              const member = members.find(m => m.id === assignment.assignedTo);
              
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {member?.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {member?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{member?.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor(assignment.role)}`}>
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(assignment.role)}
                              <span className="capitalize">{assignment.role}</span>
                            </div>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          {assignment.estimatedTime && (
                            <span>⏱️ {assignment.estimatedTime}h</span>
                          )}
                          {assignment.dueDate && (
                            <span>📅 {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            assignment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            assignment.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {assignment.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        assignment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateAssignment(assignment.id, { status: 'completed' })}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                        title="Mark as completed"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {assignment.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{assignment.notes}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddAssignment && renderAssignmentForm()}
        {showWorkloadAnalysis && renderWorkloadAnalysis()}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedTaskAssignment; 