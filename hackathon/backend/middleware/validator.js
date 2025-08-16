const { validationResult, body, param, query } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Common validation rules
const commonValidations = {
  // User related validations
  userId: param('userId').isMongoId().withMessage('Invalid user ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  
  // Pagination validations
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  // Common string validations
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  title: body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  description: body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  // Date validations
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format'),
  
  // File validations
  fileType: body('fileType')
    .optional()
    .isIn(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'])
    .withMessage('Invalid file type'),
  
  // URL validations
  url: body('url')
    .optional()
    .isURL()
    .withMessage('Invalid URL format')
};

// Validation chains for different routes
const validations = {
  // Auth validations
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password').exists().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  // User validations
  updateProfile: [
    commonValidations.name,
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    handleValidationErrors
  ],
  
  // Todo validations
  createTodo: [
    commonValidations.title,
    commonValidations.description,
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority level'),
    handleValidationErrors
  ],
  
  // Study room validations
  createStudyRoom: [
    commonValidations.title,
    commonValidations.description,
    body('maxParticipants')
      .optional()
      .isInt({ min: 2, max: 50 })
      .withMessage('Max participants must be between 2 and 50'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean'),
    handleValidationErrors
  ],
  
  // File upload validations
  uploadFile: [
    body('fileName')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),
    commonValidations.fileType,
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  validations
}; 