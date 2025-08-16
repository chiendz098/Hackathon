import { useState, useCallback, useEffect } from 'react';
import { validateForm, validateField } from '../utils/validation';
import { handleValidationError, showErrorNotification } from '../utils/errorHandler';

const useForm = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  // Handle field change
  const handleChange = useCallback((event) => {
    const { name, value, type, files } = event.target;
    
    // Handle file inputs
    if (type === 'file') {
      setValues(prev => ({
        ...prev,
        [name]: files[0]
      }));
      return;
    }
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setValues(prev => ({
        ...prev,
        [name]: event.target.checked
      }));
      return;
    }
    
    // Handle all other inputs
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    setIsDirty(true);
  }, []);

  // Handle field blur
  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field on blur if we have validation rules
    if (validationRules[name]) {
      const result = validateField(values[name], validationRules[name]);
      setErrors(prev => ({
        ...prev,
        [name]: result.valid ? '' : result.message
      }));
    }
  }, [values, validationRules]);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate all fields
    const validationResult = validateForm(values, validationRules);
    
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      // Mark all fields as touched to show errors
      const touchedFields = Object.keys(validationRules).reduce((acc, field) => ({
        ...acc,
        [field]: true
      }), {});
      setTouched(touchedFields);
      
      showErrorNotification(handleValidationError(validationResult.errors));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      resetForm();
    } catch (error) {
      showErrorNotification(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set a single form value programmatically
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  }, []);

  // Set multiple form values programmatically
  const setMultipleValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
    setIsDirty(true);
  }, []);

  // Set a single error programmatically
  const setError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Clear a single error
  const clearError = useCallback((name) => {
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validate a single field programmatically
  const validateFieldValue = useCallback((name) => {
    if (!validationRules[name]) return true;
    
    const result = validateField(values[name], validationRules[name]);
    setErrors(prev => ({
      ...prev,
      [name]: result.valid ? '' : result.message
    }));
    
    return result.valid;
  }, [values, validationRules]);

  // Validate all fields programmatically
  const validateAllFields = useCallback(() => {
    const validationResult = validateForm(values, validationRules);
    setErrors(validationResult.errors);
    return validationResult.isValid;
  }, [values, validationRules]);

  // Effect to validate form when values change and field is touched
  useEffect(() => {
    Object.keys(touched).forEach(field => {
      if (touched[field] && validationRules[field]) {
        validateFieldValue(field);
      }
    });
  }, [values, touched, validateFieldValue, validationRules]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    setError,
    clearError,
    clearErrors,
    validateField: validateFieldValue,
    validateForm: validateAllFields,
    resetForm
  };
};

export default useForm; 