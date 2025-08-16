const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Todo = sequelize.define('Todo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remindAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high']],
      },
    },
    priorityLabel: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['none', 'low', 'medium', 'high']],
      },
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'normal',
      validate: {
        isIn: [['normal', 'exam', 'study', 'work', 'personal', 'project', 'review', 'practice', 'assignment', 'quiz', 'homework', 'research', 'presentation', 'lab', 'tutorial']],
      },
    },
    category: {
      type: DataTypes.ENUM(
        'personal', 'work', 'study', 'health', 'finance', 'social',
        'hobby', 'travel', 'shopping', 'family', 'career', 'learning',
        'exercise', 'reading', 'coding', 'design', 'writing', 'other'
      ),
      defaultValue: 'personal'
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'done', 'cancelled', 'overdue'),
      defaultValue: 'pending',
    },
    estimatedTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    actualTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurringPattern: {
      type: DataTypes.JSON,
      defaultValue: null, // {frequency: 'daily', interval: 1, endDate: null}
    },
    teacherInfo: {
      type: DataTypes.JSON,
      defaultValue: null, // {name: '', email: '', office: ''}
    },
    creationMethod: {
      type: DataTypes.STRING,
      defaultValue: 'manual', // 'manual', 'ai', 'template', 'import'
    },
    aiAnalysis: {
      type: DataTypes.JSON,
      defaultValue: {
        complexity: 'medium',
        keywords: [],
        relatedTopics: [],
        prerequisites: []
      }
    },
    timeBlocks: {
      type: DataTypes.JSON,
      defaultValue: [] // Array of {start, end, date} for calendar blocking
    },
    conflictResolution: {
      type: DataTypes.JSON,
      defaultValue: {
        hasConflicts: false,
        suggestedAlternatives: [],
        autoRescheduled: false
      }
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedTo: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of user IDs for collaboration
    },
    isTimerRunning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    timerStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // New fields for group todos and teacher assignments
    todoType: {
      type: DataTypes.STRING,
      defaultValue: 'personal', // 'personal', 'group', 'teacher_assignment'
      validate: {
        isIn: [['personal', 'group', 'teacher_assignment']],
      },
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'classrooms',
        key: 'id',
      },
    },
    // Group todo specific fields
    groupMembers: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of {userId, role, assignedTasks, progress}
    },
    groupProgress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    groupLeader: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // Enhanced group collaboration fields
    groupSettings: {
      type: DataTypes.JSON,
      defaultValue: {
        allowMemberEditing: true,
        requireApproval: false,
        autoAssignTasks: false,
        progressTracking: true,
        deadlineReminders: true,
        realTimeUpdates: true,
        liveCollaboration: true,
        versionControl: true,
        conflictResolution: 'auto', // auto, manual, voting
        consensusRequired: false,
        votingSystem: false,
        feedbackLoops: true,
        peerReview: false,
        qualityCheckpoints: [],
        collaborationMetrics: {
          participationRate: 0,
          contributionBalance: 0,
          communicationEfficiency: 0,
          conflictResolutionTime: 0,
          teamSynergy: 0
        }
      },
      field: 'group_settings'
    },
    groupChatEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'group_chat_enabled'
    },
    groupFileSharing: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'group_file_sharing'
    },
    // Real-time collaboration
    realTimeFeatures: {
      type: DataTypes.JSON,
      defaultValue: {
        liveEditing: false,
        cursorTracking: false,
        changeHistory: [],
        conflictDetection: true,
        autoMerge: true,
        collaborationMode: 'sync', // sync, async, hybrid
        offlineSupport: true,
        syncInterval: 5000, // milliseconds
        presenceIndicators: true,
        activityFeed: true,
        notifications: {
          realTime: true,
          mentions: true,
          changes: true,
          conflicts: true
        }
      },
      field: 'real_time_features'
    },
    // Teacher assignment specific fields
    assignmentType: {
      type: DataTypes.STRING,
      allowNull: true, // 'homework', 'project', 'exam', 'quiz', 'presentation', 'lab'
    },

    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    studentScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Collaboration fields
    collaborators: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of {userId, role, permissions, lastActive}
    },
    sharedWith: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of user IDs who can view this todo
    },
    // AI and chatbot fields
    createdBy: {
      type: DataTypes.STRING,
      defaultValue: 'user', // 'user', 'chatbot', 'teacher'
    },
    aiPrompt: {
      type: DataTypes.TEXT,
      allowNull: true, // Original prompt if created by chatbot
    },
    // Enhanced AI features
    aiAnalysis: {
      type: DataTypes.JSON,
      defaultValue: {
        complexity: 'medium',
        keywords: [],
        relatedTopics: [],
        prerequisites: [],
        estimatedEffort: 'medium',
        bestTimeToDo: 'morning', // morning, afternoon, evening, night
        energyRequirement: 'medium',
        focusRequirement: 'normal',
        suggestedBreakdown: [],
        similarTasks: [],
        learningPath: [],
        skillGaps: [],
        motivationFactors: [],
        potentialObstacles: [],
        successMetrics: []
      },
      field: 'ai_analysis'
    },
    aiRecommendations: {
      type: DataTypes.JSON,
      defaultValue: {
        optimalSchedule: [],
        resourceSuggestions: [],
        studyTechniques: [],
        collaborationOpportunities: [],
        timeManagementTips: [],
        motivationStrategies: [],
        relatedContent: [],
        skillDevelopment: []
      },
      field: 'ai_recommendations'
    },
    smartScheduling: {
      type: DataTypes.JSON,
      defaultValue: {
        autoScheduled: false,
        optimalTimeSlots: [],
        conflictAvoidance: true,
        energyBasedScheduling: true,
        focusOptimization: true,
        breakOptimization: true,
        deadlineBuffer: 120, // minutes
        procrastinationPrevention: true,
        // Advanced scheduling features
        timeOptimization: {
          enabled: true,
          algorithm: 'ai', // ai, rule-based, machine-learning
          factors: ['energy', 'focus', 'deadline', 'priority', 'complexity', 'mood'],
          learningFromHistory: true,
          adaptiveScheduling: true,
          weatherIntegration: false,
          calendarIntegration: true
        },
        conflictResolution: {
          enabled: true,
          strategy: 'smart', // smart, manual, ai-suggested
          autoReschedule: true,
          suggestAlternatives: true,
          priorityBased: true,
          deadlineRespect: true
        },
        energyManagement: {
          enabled: true,
          energyTracking: true,
          optimalEnergyLevels: {
            high: ['complex', 'creative', 'learning'],
            medium: ['routine', 'communication', 'planning'],
            low: ['simple', 'maintenance', 'review']
          },
          energyRecovery: true,
          breakOptimization: true
        },
        focusOptimization: {
          enabled: true,
          focusTracking: true,
          optimalFocusTimes: [],
          distractionBlocking: true,
          deepWorkSessions: true,
          focusMetrics: {
            currentFocus: 0,
            averageFocus: 0,
            focusTrend: 'stable'
          }
        },
        procrastinationPrevention: {
          enabled: true,
          triggers: [],
          strategies: ['timeboxing', 'accountability', 'rewards', 'social-pressure'],
          accountabilityPartners: [],
          progressTracking: true,
          motivationBoosters: []
        }
      },
      field: 'smart_scheduling'
    },
    // Advanced features
    energyLevel: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high']],
      },
    },
    mood: {
      type: DataTypes.STRING,
      defaultValue: 'neutral',
      validate: {
        isIn: [['excited', 'happy', 'neutral', 'tired', 'stressed']],
      },
    },
    focusLevel: {
      type: DataTypes.STRING,
      defaultValue: 'normal',
      validate: {
        isIn: [['normal', 'deep', 'flow', 'sprint']],
      },
    },
    studyMode: {
      type: DataTypes.STRING,
      defaultValue: 'individual',
      validate: {
        isIn: [['individual', 'group', 'pair']],
      },
    },
    motivation: {
      type: DataTypes.STRING,
      defaultValue: 'high',
      validate: {
        isIn: [['low', 'medium', 'high']],
      },
    },
    // Subtasks for complex todos
    subtasks: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of {id, title, description, status, assignedTo}
    },
    // Study session data
    studySession: {
      type: DataTypes.JSON,
      defaultValue: null, // {duration, breakTime, sessions, focusMode, ambientSound}
    },
    // Enhanced analytics and insights
    analytics: {
      type: DataTypes.JSON,
      defaultValue: {
        performance: {
          completionRate: 0,
          averageCompletionTime: 0,
          onTimeCompletion: 0,
          earlyCompletion: 0,
          lateCompletion: 0,
          qualityScore: 0,
          efficiencyScore: 0,
          productivityIndex: 0
        },
        timeAnalysis: {
          totalTimeSpent: 0,
          averageTimePerTask: 0,
          timeDistribution: {
            planning: 0,
            execution: 0,
            review: 0,
            breaks: 0
          },
          peakProductivityHours: [],
          optimalWorkDuration: 0,
          breakEfficiency: 0
        },
        learningMetrics: {
          knowledgeRetention: 0,
          skillImprovement: 0,
          conceptMastery: 0,
          learningCurve: 'stable',
          knowledgeGaps: [],
          strengths: [],
          areasForImprovement: []
        },
        behavioralPatterns: {
          procrastinationTendency: 0,
          focusPatterns: [],
          energyPatterns: [],
          motivationTrends: [],
          stressIndicators: [],
          workStyle: 'balanced', // balanced, burst, consistent, irregular
          preferredEnvironment: 'quiet'
        },
        socialMetrics: {
          collaborationEffectiveness: 0,
          communicationQuality: 0,
          teamContribution: 0,
          leadershipScore: 0,
          mentorshipImpact: 0,
          networkGrowth: 0
        },
        goalProgress: {
          shortTermGoals: [],
          longTermGoals: [],
          milestoneAchievement: 0,
          goalAlignment: 0,
          progressConsistency: 0,
          successPredictors: []
        }
      },
      field: 'analytics'
    },
    // Enhanced fields for better todo management
    location: {
      type: DataTypes.STRING,
      allowNull: true // Where to do this task
    },
    // Gamification fields
    gamification: {
      type: DataTypes.JSON,
      defaultValue: {
        points: 0,
        experience: 0,
        level: 1,
        streak: 0,
        maxStreak: 0,
        achievements: [],
        badges: [],
        challenges: [],
        socialScore: 0,
        reputation: 0,
        leaderboardRank: null,
        milestones: [],
        rewards: [],
        skillPoints: {},
        masteryLevel: 0
      },
      field: 'gamification'
    },
    // Social features
    socialFeatures: {
      type: DataTypes.JSON,
      defaultValue: {
        likes: 0,
        shares: 0,
        comments: 0,
        followers: 0,
        following: 0,
        collaborations: 0,
        mentorship: {
          isMentor: false,
          isMentee: false,
          mentorId: null,
          menteeIds: [],
          mentorshipLevel: 0
        },
        studyGroups: [],
        accountabilityPartners: [],
        publicProfile: false,
        socialVisibility: 'friends' // public, friends, private
      },
      field: 'social_features'
    },
    reminder: {
      type: DataTypes.JSON,
      defaultValue: {
        enabled: false,
        time: null, // specific time
        beforeDue: 60 // minutes before due date
      }
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: [] // Array of file URLs and metadata
    },
    checklist: {
      type: DataTypes.JSON,
      defaultValue: [] // Array of {id, text, status, createdAt}
    },
    template: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // If this todo can be used as template
    },
    templateData: {
      type: DataTypes.JSON,
      defaultValue: null // Template configuration
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6' // Color for visual organization
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true // Icon identifier
    },
  }, {
    tableName: 'todos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Hooks to ensure data consistency
  Todo.beforeFind((options) => {
    // Ensure tags are always an array when fetching
    if (options.attributes && !options.attributes.includes('tags')) {
      options.attributes.push('tags');
    }
  });

  Todo.afterFind((instances) => {
    // Ensure JSON fields are always arrays/objects
    const ensureArray = (value) => Array.isArray(value) ? value : [];
    const ensureObject = (value) => typeof value === 'object' && value !== null ? value : {};
    
    if (Array.isArray(instances)) {
      instances.forEach(instance => {
        if (instance && instance.dataValues) {
          instance.dataValues.tags = ensureArray(instance.dataValues.tags);
          instance.dataValues.subtasks = ensureArray(instance.dataValues.subtasks);
          instance.dataValues.attachments = ensureArray(instance.dataValues.attachments);
          instance.dataValues.assignments = ensureArray(instance.dataValues.assignments);
          instance.dataValues.checklist = ensureArray(instance.dataValues.checklist);
          instance.dataValues.aiAnalysis = ensureObject(instance.dataValues.aiAnalysis);
          instance.dataValues.gamification = ensureObject(instance.dataValues.gamification);
          instance.dataValues.socialFeatures = ensureObject(instance.dataValues.socialFeatures);
        }
      });
    } else if (instances && instances.dataValues) {
      instances.dataValues.tags = ensureArray(instances.dataValues.tags);
      instances.dataValues.subtasks = ensureArray(instances.dataValues.subtasks);
      instances.dataValues.attachments = ensureArray(instances.dataValues.attachments);
      instances.dataValues.assignments = ensureArray(instances.dataValues.assignments);
      instances.dataValues.checklist = ensureArray(instances.dataValues.checklist);
      instances.dataValues.aiAnalysis = ensureObject(instances.dataValues.aiAnalysis);
      instances.dataValues.gamification = ensureObject(instances.dataValues.gamification);
      instances.dataValues.socialFeatures = ensureObject(instances.dataValues.socialFeatures);
    }
  });

  Todo.afterCreate((instance) => {
    // Ensure JSON fields are always arrays/objects after creation
    const ensureArray = (value) => Array.isArray(value) ? value : [];
    const ensureObject = (value) => typeof value === 'object' && value !== null ? value : {};
    
    if (instance && instance.dataValues) {
      instance.dataValues.tags = ensureArray(instance.dataValues.tags);
      instance.dataValues.subtasks = ensureArray(instance.dataValues.subtasks);
      instance.dataValues.attachments = ensureArray(instance.dataValues.attachments);
      instance.dataValues.assignments = ensureArray(instance.dataValues.assignments);
      instance.dataValues.checklist = ensureArray(instance.dataValues.checklist);
      instance.dataValues.aiAnalysis = ensureObject(instance.dataValues.aiAnalysis);
      instance.dataValues.gamification = ensureObject(instance.dataValues.gamification);
      instance.dataValues.socialFeatures = ensureObject(instance.dataValues.socialFeatures);
    }
  });

  Todo.afterUpdate((instance) => {
    // Ensure JSON fields are always arrays/objects after update
    const ensureArray = (value) => Array.isArray(value) ? value : [];
    const ensureObject = (value) => typeof value === 'object' && value !== null ? value : {};
    
    if (instance && instance.dataValues) {
      instance.dataValues.tags = ensureArray(instance.dataValues.tags);
      instance.dataValues.subtasks = ensureArray(instance.dataValues.subtasks);
      instance.dataValues.attachments = ensureArray(instance.dataValues.attachments);
      instance.dataValues.assignments = ensureArray(instance.dataValues.assignments);
      instance.dataValues.checklist = ensureArray(instance.dataValues.checklist);
      instance.dataValues.aiAnalysis = ensureObject(instance.dataValues.aiAnalysis);
      instance.dataValues.gamification = ensureObject(instance.dataValues.gamification);
      instance.dataValues.socialFeatures = ensureObject(instance.dataValues.socialFeatures);
    }
  });

  Todo.associate = (models) => {
    Todo.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Todo.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
    Todo.belongsTo(models.Classroom, { foreignKey: 'classroomId', as: 'classroom' });
    Todo.belongsTo(models.User, { foreignKey: 'assignedBy', as: 'assigner' });
    Todo.belongsTo(models.User, { foreignKey: 'groupLeader', as: 'leader' });
    
    Todo.hasMany(models.TodoComment, { foreignKey: 'todoId', as: 'comments' });
    Todo.hasMany(models.TodoSubmission, { foreignKey: 'todoId', as: 'submissions' });
    Todo.hasMany(models.TimeEntry, { foreignKey: 'todoId', as: 'timeEntries' });
    Todo.hasMany(models.TodoAssignment, { foreignKey: 'todoId', as: 'assignments' });
  };

  return Todo;
};