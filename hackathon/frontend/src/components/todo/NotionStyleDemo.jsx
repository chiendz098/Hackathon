import React, { useState } from 'react';
import NotionStyleGroupTodo from './NotionStyleGroupTodo';

const NotionStyleDemo = () => {
  const [groupId] = useState('demo-group-123');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotionStyleGroupTodo 
        groupId={groupId}
        // Các props khác sẽ được truyền từ context hoặc API
      />
    </div>
  );
};

export default NotionStyleDemo; 