import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getForumPosts, createForumPost, commentForumPost, voteForumPost } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getForumPosts();
      if (response.data) {
        if (response.data.success) {
          setPosts(response.data.posts || []);
        } else {
          setPosts(response.data || []); // Fallback for direct array response
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) return;
    
    try {
      await createForumPost(newPost);
      setNewPost({ title: '', content: '' });
      setShowCreateForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!comment) return;
    
    try {
      await commentForumPost({ postId, content: comment });
      setComment('');
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleVote = async (postId, value) => {
    try {
      await voteForumPost({ postId, value });
      fetchPosts();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Community <span className="gradient-text">Posts</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Share your thoughts, ask questions, and engage with the community
          </p>
          
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              {showCreateForm ? 'Cancel' : '📝 Create New Post'}
            </motion.button>
          )}
        </motion.div>

        {/* Create Post Form */}
        {showCreateForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Create New Post</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Post title..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Share your thoughts..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Create Post
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                {/* Post Header */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {post.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{post.author?.name || 'Anonymous'}</div>
                    <div className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Post Content */}
                <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleVote(post.id, 1)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <span>👍</span>
                      <span>{post.votes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(post.id, -1)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <span>👎</span>
                    </button>
                    <button
                      onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <span>💬</span>
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {selectedPost === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4">Comments</h4>
                    
                    {/* Comments List */}
                    <div className="space-y-3 mb-4">
                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{comment.author?.name || 'Anonymous'}</div>
                              <div className="text-gray-400 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    {user && (
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          Comment
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400">
                <p className="text-xl mb-2">No posts available yet.</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
                {user && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 