'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '../../utils/dateUtils';

export default function BlogListingContent({ initialBlogs = null, initialTotalPages = 1 }) {
  const [blogs, setBlogs] = useState(initialBlogs || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState(
    initialBlogs ? [...new Set(initialBlogs.flatMap(b => b.categories || []))] : []
  );

  useEffect(() => {
    // Skip the initial fetch if server already provided data for page 1 with no filter
    if (initialBlogs && currentPage === 1 && !selectedCategory) return;
    fetchBlogs();
  }, [currentPage, selectedCategory]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '9'
      });
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/blogs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBlogs(data.data.blogs);
        setTotalPages(data.data.pagination.totalPages);
        
        // Extract unique categories
        const allCategories = data.data.blogs.flatMap(blog => blog.categories);
        const uniqueCategories = [...new Set(allCategories)];
        setCategories(uniqueCategories);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-btn-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              PropFinova Blog
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Expert insights, market trends, and valuable tips for your real estate journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        {categories.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-btn-text'
                    : 'bg-surface text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Posts
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-btn-text'
                      : 'bg-surface text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {/* Blog Grid */}
        {blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogs.map(blog => (
                <article
                  key={blog._id}
                  className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <div className="cursor-pointer">
                      {blog.featuredImage && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {blog.categories.slice(0, 2).map(category => (
                            <span
                              key={category}
                              className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
                          {blog.title}
                        </h2>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {blog.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {blog.author?.name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <span>{blog.author?.name || 'PropFinova Team'}</span>
                          </div>
                          <div className="text-right">
                            <div>{formatDate(blog.publishedAt || blog.createdAt)}</div>
                            <div className="text-xs">{blog.readingTime} min read</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-surface text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  Previous
                </button>
                
                <div className="flex space-x-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 font-medium rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? 'bg-primary text-btn-text'
                          : 'bg-surface text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-primary text-btn-text font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : !loading ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-600">
              {selectedCategory ? `No posts found for "${selectedCategory}" category.` : 'We\'re working on bringing you great content!'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}