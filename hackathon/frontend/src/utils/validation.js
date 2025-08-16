// Regular expressions for validation
const patterns = {
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
  password: /^.{1,}$/, // relaxed: any non-empty string
  name: /^[a-zA-Z\s]{2,100}$/,
  phone: /^\+?[0-9]{10,15}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
};

// Validation rules
export const rules = {
  required: (value) => ({
    valid: !!value && value.toString().trim().length > 0,
    message: 'This field is required',
  }),

  email: (value) => ({
    valid: patterns.email.test(value),
    message: 'Please enter a valid email address',
  }),

  password: (value) => ({
    valid: patterns.password.test(value),
    message: 'Password is required',
  }),

  name: (value) => ({
    valid: patterns.name.test(value),
    message: 'Name must be between 2 and 100 characters and contain only letters and spaces',
  }),

  phone: (value) => ({
    valid: patterns.phone.test(value),
    message: 'Please enter a valid phone number',
  }),

  url: (value) => ({
    valid: !value || patterns.url.test(value),
    message: 'Please enter a valid URL',
  }),

  minLength: (min) => (value) => ({
    valid: value && value.length >= min,
    message: `Must be at least ${min} characters`,
  }),

  maxLength: (max) => (value) => ({
    valid: !value || value.length <= max,
    message: `Must not exceed ${max} characters`,
  }),

  match: (matchValue, fieldName) => (value) => ({
    valid: value === matchValue,
    message: `Must match ${fieldName}`,
  }),

  number: (value) => ({
    valid: !isNaN(value) && value !== null && value !== '',
    message: 'Must be a valid number',
  }),

  min: (min) => (value) => ({
    valid: Number(value) >= min,
    message: `Must be at least ${min}`,
  }),

  max: (max) => (value) => ({
    valid: Number(value) <= max,
    message: `Must not exceed ${max}`,
  }),

  fileType: (allowedTypes) => (file) => ({
    valid: !file || allowedTypes.includes(file.type),
    message: `File type must be one of: ${allowedTypes.join(', ')}`,
  }),

  fileSize: (maxSize) => (file) => ({
    valid: !file || file.size <= maxSize,
    message: `File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
  }),
};

// Validate a single field
export const validateField = (value, fieldRules) => {
  for (const rule of fieldRules) {
    const result = rule(value);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true, message: '' };
};

// Validate an entire form
export const validateForm = (values, formRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(formRules).forEach((field) => {
    const result = validateField(values[field], formRules[field]);
    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Example form configurations
export const formConfigs = {
  login: {
    email: [rules.required, rules.email],
    password: [rules.required],
  },
  
  register: {
    name: [rules.required, rules.name],
    email: [rules.required, rules.email],
    password: [rules.required],
    confirmPassword: [
      rules.required,
      (value, formValues) => rules.match(formValues.password, 'password')(value),
    ],
  },
  
  createTodo: {
    title: [rules.required, rules.maxLength(200)],
    description: [rules.maxLength(1000)],
    dueDate: [rules.required],
    priority: [rules.required],
  },
  

  
  updateProfile: {
    name: [rules.required, rules.name],
    bio: [rules.maxLength(500)],
    phone: [rules.phone],
    website: [rules.url],
  },
  
  fileUpload: {
    file: [
      rules.required,
      rules.fileType(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
      rules.fileSize(10 * 1024 * 1024), // 10MB
    ],
  },
}; 