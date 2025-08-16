import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getForumPosts, commentForumPost } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await getForumPosts();
      if (response.data && response.data.success) {
        const posts = response.data.posts || [];
        const foundPost = posts.find(p => p.id == id);
        if (foundPost) {
          setPost(foundPost);
        } else {
          setPost(null);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleComment = async () => {
    if (!comment || !user) return;
    
    try {
      await commentForumPost({ postId: id, content: comment });
      setComment('');
      fetchPost(); // Refresh to get the new comment
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-gray-300 mb-8">The post you're looking for doesn't exist.</p>
          <Link 
            to="/posts" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            to="/posts" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Posts
          </Link>
        </motion.div>

        {/* Post Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8"
        >
          {/* Post Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {post.title}
            </h1>
            <div className="flex items-center text-gray-300 text-sm">
              <span>By {post.author?.name || 'Unknown'}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post.category && (
                <>
                  <span className="mx-2">•</span>
                  <span className="bg-purple-600 px-2 py-1 rounded text-xs">
                    {post.category}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Post Stats */}
          <div className="flex items-center text-gray-400 text-sm">
            <span>{post.views || 0} views</span>
            <span className="mx-2">•</span>
            <span>{post.comments?.length || 0} comments</span>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Comments</h2>

          {/* Add Comment */}
          {user && (
            <div className="mb-8">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-white/20 border border-white/30 rounded-lg p-4 text-white placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
              <button
                onClick={handleComment}
                disabled={!comment.trim()}
                className="mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add Comment
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-purple-400 font-medium">
                      {comment.author?.name || 'Unknown'}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-200">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 