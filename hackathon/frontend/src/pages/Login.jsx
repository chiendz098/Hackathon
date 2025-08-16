import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useForm from '../hooks/useForm';
import { login } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { formConfigs } from '../utils/validation';
import { logger } from '../utils/monitoring';
import { ErrorBoundary } from '../utils/errorHandler';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm(
    {
      email: '',
      password: ''
    },
    formConfigs.login,
    async (formData) => {
      try {
        const response = await login(formData.email, formData.password);
        
        // Log successful login
        logger.info('User logged in successfully', { email: formData.email });
        
        // Extract data from axios response
        const responseData = response.data;
        
        // Use AuthContext to handle login
        if (responseData && responseData.user && responseData.token) {
          authLogin(responseData.user, responseData.token);
        } else {
          console.error('Invalid login response structure:', responseData);
          throw new Error('Invalid login response from server');
        }
        
              // Redirect to todo
      navigate('/todo');
      } catch (error) {
        // Error is automatically handled by useApi hook
        logger.error('Login failed', { email: formData.email });
        throw error;
      }
    }
  );

  const renderError = (field) => {
    if (touched[field] && errors[field]) {
      return (
        <div className="text-red-500 text-sm mt-1" data-testid={`${field}-error`}>
          {errors[field]}
        </div>
      );
    }
    return null;
  };

  const fillDemoCredentials = () => {
    handleChange({
      target: {
        name: 'email',
        value: 'admin@fptunihub.com'
      }
    });
    handleChange({
      target: {
        name: 'password',
        value: 'admin123'
      }
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 animate-fade-in-up">
              Welcome Back
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 animate-fade-in-up stagger-1">
              Sign in to your FPT COMPASS account
            </p>
          </div>
          
          {/* Demo Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in-up stagger-2">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Admin:</strong> admin@fptunihub.com / admin123</div>
              <div><strong>Student:</strong> quangchienaz3@gmail.com / password123</div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Fill Demo Admin
            </button>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    touched.email && errors.email
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                  value={values.email || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  data-testid="email-input"
                />
                {renderError('email')}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    touched.password && errors.password
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={values.password || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  data-testid="password-input"
                />
                {renderError('password')}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                data-testid="login-button"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Don't have an account? Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Login; 