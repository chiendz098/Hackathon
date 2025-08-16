import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NotionStyleGroupTodo from '../components/todo/NotionStyleGroupTodo';
import TodoDetailPage from '../pages/TodoDetailPage';

const NotionStyleRoutes = () => {
  return (
    <Routes>
      {/* Group todos main page */}
      <Route 
        path="/groups/:groupId/todos" 
        element={<NotionStyleGroupTodo />} 
      />
      
      {/* Todo detail page */}
      <Route 
        path="/groups/:groupId/todos/:todoId" 
        element={<TodoDetailPage />} 
      />
      
      {/* Redirect to main group page if no specific route */}
      <Route 
        path="/groups/:groupId" 
        element={<Navigate to={`/groups/:groupId/todos`} replace />} 
      />
    </Routes>
  );
};

export default NotionStyleRoutes; 