import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Download, Upload, FileText, Calendar, CheckSquare } from 'lucide-react';

const TodoExportImport = ({ todos, onImport }) => {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [importFile, setImportFile] = useState(null);

  const exportFormats = [
    { value: 'json', label: 'JSON', icon: '📄' },
    { value: 'csv', label: 'CSV', icon: '📊' },
    { value: 'txt', label: 'Plain Text', icon: '📝' }
  ];

  const exportTodos = () => {
    const exportData = todos.map(todo => ({
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      category: todo.category,
      deadline: todo.deadline,
      estimatedTime: todo.estimatedTime,
      actualTime: todo.actualTime,
      subject: todo.subject,
      location: todo.location,
      tags: todo.tags,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt
    }));

    let content, filename, mimeType;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `todos_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        const headers = ['Title', 'Description', 'Status', 'Priority', 'Category', 'Deadline', 'Estimated Time', 'Actual Time', 'Subject', 'Location', 'Tags'];
        const csvContent = [
          headers.join(','),
          ...exportData.map(todo => [
            `"${todo.title || ''}"`,
            `"${todo.description || ''}"`,
            todo.status || '',
            todo.priority || '',
            todo.category || '',
            todo.deadline || '',
            todo.estimatedTime || '',
            todo.actualTime || '',
            `"${todo.subject || ''}"`,
            `"${todo.location || ''}"`,
            `"${Array.isArray(todo.tags) ? todo.tags.join(', ') : ''}"`
          ].join(','))
        ].join('\n');
        content = csvContent;
        filename = `todos_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = exportData.map(todo => 
          `Title: ${todo.title}\n` +
          `Description: ${todo.description || 'N/A'}\n` +
          `Status: ${todo.status}\n` +
          `Priority: ${todo.priority}\n` +
          `Category: ${todo.category}\n` +
          `Deadline: ${todo.deadline || 'N/A'}\n` +
          `Estimated Time: ${todo.estimatedTime || 'N/A'} min\n` +
          `Actual Time: ${todo.actualTime || 'N/A'} min\n` +
          `Subject: ${todo.subject || 'N/A'}\n` +
          `Location: ${todo.location || 'N/A'}\n` +
          `Tags: ${Array.isArray(todo.tags) ? todo.tags.join(', ') : 'N/A'}\n` +
          `Created: ${new Date(todo.createdAt).toLocaleString()}\n` +
          `Updated: ${new Date(todo.updatedAt).toLocaleString()}\n` +
          '─'.repeat(50)
        ).join('\n\n');
        filename = `todos_${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setImportFile(file);
  };

  const importTodos = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      let importData;

      if (importFile.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else if (importFile.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        importData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, ''));
          const todo = {};
          headers.forEach((header, index) => {
            todo[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
          });
          return todo;
        });
      } else {
        throw new Error('Unsupported file format');
      }

      onImport(importData);
      setImportFile(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error importing todos:', error);
      alert('Error importing todos. Please check the file format.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
          currentTheme === 'neon' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Download className="w-4 h-4 mr-1" />
        Export/Import
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-50 min-w-80 ${
            currentTheme === 'neon' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Export/Import Todos
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded ${
                  currentTheme === 'neon' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Export Section */}
            <div>
              <h4 className={`font-medium mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Export Todos
              </h4>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  {exportFormats.map(format => (
                    <button
                      key={format.value}
                      onClick={() => setExportFormat(format.value)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        exportFormat === format.value
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : currentTheme === 'neon'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{format.icon}</span>
                      {format.label}
                    </button>
                  ))}
                </div>
                <motion.button
                  onClick={exportTodos}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export {todos.length} Todos
                </motion.button>
              </div>
            </div>

            {/* Import Section */}
            <div>
              <h4 className={`font-medium mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Import Todos
              </h4>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className={`w-full p-2 rounded border ${
                    currentTheme === 'neon'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {importFile && (
                  <div className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Selected: {importFile.name}
                  </div>
                )}
                <motion.button
                  onClick={importTodos}
                  disabled={!importFile}
                  className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                    importFile
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={importFile ? { scale: 1.02 } : {}}
                  whileTap={importFile ? { scale: 0.98 } : {}}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import Todos
                </motion.button>
              </div>
            </div>

            {/* Stats */}
            <div className={`pt-2 border-t ${
              currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center p-2 rounded ${
                  currentTheme === 'neon' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className="font-semibold">{todos.length}</div>
                  <div>Total Todos</div>
                </div>
                <div className={`text-center p-2 rounded ${
                  currentTheme === 'neon' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className="font-semibold">
                    {todos.filter(t => t.status === 'done' || t.status === 'completed').length}
                  </div>
                  <div>Completed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TodoExportImport; 