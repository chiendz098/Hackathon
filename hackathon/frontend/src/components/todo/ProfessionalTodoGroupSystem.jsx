import React, { useState, useEffect } from 'react';
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
import ProfessionalTodoGroupManager from './ProfessionalTodoGroupManager';
import AdvancedTaskAssignment from './AdvancedTaskAssignment';
import AdvancedProgressTracker from './AdvancedProgressTracker';
import CollaborationDashboard from './CollaborationDashboard';

const ProfessionalTodoGroupSystem = ({ group, onClose }) => {
  const { user } = useAuth();
  const { get, post, put, del } = useApi();
  
  const [activeView, setActiveView] = useState('main');
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTodoCreated = () => {
    // Refresh data when todo is created
    setActiveView('main');
  };

  const handleTodoSelected = (todo) => {
    setSelectedTodo(todo);
    setActiveView('todo-detail');
  };

  const handleBackToMain = () => {
    setSelectedTodo(null);
    setActiveView('main');
  };

  const renderMainView = () => (
    <ProfessionalTodoGroupManager
      group={group}
      onTodoCreated={handleTodoCreated}
      onClose={onClose}
      onTodoSelected={handleTodoSelected}
    />
  );

  const renderTodoDetailView = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToMain}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{selectedTodo?.title}</h1>
              <p className="text-sm text-gray-500">
                {selectedTodo?.description?.substring(0, 100)}...
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('assignment')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Manage Assignments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
            { id: 'collaboration', label: 'Collaboration', icon: MessageSquare },
            { id: 'assignment', label: 'Task Assignment', icon: UserCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeView === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AdvancedProgressTracker
                todo={selectedTodo}
                onProgressUpdate={handleTodoCreated}
              />
            </motion.div>
          )}

          {activeView === 'collaboration' && (
            <motion.div
              key="collaboration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CollaborationDashboard
                group={group}
                onUpdate={handleTodoCreated}
              />
            </motion.div>
          )}

          {activeView === 'assignment' && (
            <motion.div
              key="assignment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AdvancedTaskAssignment
                todo={selectedTodo}
                group={group}
                onAssignmentUpdate={handleTodoCreated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {activeView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderMainView()}
          </motion.div>
        )}

        {activeView === 'todo-detail' && (
          <motion.div
            key="todo-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTodoDetailView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalTodoGroupSystem; 