import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Calendar, Clock, User, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const AssignmentSubmission = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({ content: '', attachments: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/todo-assignments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!submissionForm.content.trim()) {
      toast.error('Please provide submission content');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/todo-assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedAssignment(null);
        setSubmissionForm({ content: '', attachments: [] });
        fetchAssignments(); // Refresh to show updated submission status
      } else {
        toast.error(data.message || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (assignment) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    const isOverdue = new Date() > new Date(assignment.dueDate);
    
    if (hasSubmission) return 'green';
    if (isOverdue) return 'red';
    return 'yellow';
  };

  const getStatusText = (assignment) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    const isOverdue = new Date() > new Date(assignment.dueDate);
    
    if (hasSubmission) return 'Submitted';
    if (isOverdue) return 'Overdue';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Assignment Center</h1>
        <p className="text-gray-600">View and submit your class assignments</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments</h3>
          <p className="text-gray-600">You don't have any assignments yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusColor(assignment) === 'green' ? 'bg-green-100 text-green-800' :
                      getStatusColor(assignment) === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{assignment.classroom?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{assignment.admin?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Max Score: {assignment.maxScore}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{assignment.description}</p>
                  
                  {assignment.instructions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
                      <p className="text-blue-800">{assignment.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                {assignment.submissions && assignment.submissions.length > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Submitted on {new Date(assignment.submissions[0].submittedAt).toLocaleDateString()}
                    </span>
                    {assignment.submissions[0].score && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">
                        Score: {assignment.submissions[0].score}/{assignment.maxScore}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">Not submitted</span>
                  </div>
                )}

                <button
                  onClick={() => setSelectedAssignment(assignment)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={new Date() > new Date(assignment.dueDate) && !assignment.allowLateSubmission}
                >
                  {assignment.submissions && assignment.submissions.length > 0 ? 'Resubmit' : 'Submit'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">Submit Assignment: {selectedAssignment.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Content *
                  </label>
                  <textarea
                    value={submissionForm.content}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="8"
                    placeholder="Enter your assignment submission here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Drag files here or click to upload
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmit(selectedAssignment.id)}
                      disabled={submitting || !submissionForm.content.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentSubmission; 