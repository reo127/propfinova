'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, statusFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        setError('Authentication required. Please login again.');
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams({
        admin: 'true',
        page: currentPage.toString(),
        limit: '10'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/blogs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setError('Session expired. Please login again.');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBlogs(data.data?.blogs || []);
        setTotalPages(data.data?.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError('Failed to fetch blogs repository');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug, title) => {
    if (!confirm(`Are you sure you want to delete the blog "${title || slug}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login again.');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/blogs/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Article removed from publication archive');
        fetchBlogs();
      } else {
        setError('Failed to delete blog article');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError('Failed to delete article');
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      blog.title?.toLowerCase().includes(term) ||
      blog.excerpt?.toLowerCase().includes(term) ||
      blog.categories?.some(c => c.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'archived':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Loading Editorial Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Editorial &amp; Insights
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              SEO Engine
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Author and publish real estate market reports, buyer guides, and luxury investment advisories.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Public Blog</span>
          </Link>
          <Link
            href="/admin/blogs/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['all', 'published', 'draft', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {status} Articles
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title or keyword..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Blog Articles Grid / Table */}
      {filteredBlogs.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-16 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No blog posts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No articles matched your search query.' : 'Draft your first real estate market report to improve SEO authority.'}
          </p>
          <Link
            href="/admin/blogs/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-5">Article &amp; Excerpt</th>
                  <th className="py-3.5 px-4">Publication Status</th>
                  <th className="py-3.5 px-4">Readership</th>
                  <th className="py-3.5 px-4">Author &amp; Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Article Thumbnail & Summary */}
                    <td className="py-4 px-5">
                      <div className="flex items-start space-x-3.5 max-w-lg">
                        {blog.featuredImage ? (
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Newspaper className="w-6 h-6" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                            {blog.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                            {blog.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {blog.categories?.slice(0, 2).map((category) => (
                              <span
                                key={category}
                                className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md"
                              >
                                {category}
                              </span>
                            ))}
                            {blog.categories?.length > 2 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{blog.categories.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusBadge(blog.status)}`}>
                        {blog.status}
                      </span>
                    </td>

                    {/* Readership Telemetry */}
                    <td className="py-4 px-4 whitespace-nowrap space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{blog.views || 0} views</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {blog.readingTime || 4} min read
                      </div>
                    </td>

                    {/* Author & Date */}
                    <td className="py-4 px-4 whitespace-nowrap space-y-0.5">
                      <div className="font-bold text-slate-900">
                        {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        by {blog.author?.name || 'PropFinova Editorial'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={blog.status === 'published' ? `/blog/${blog.slug}` : `/blog/${blog.slug}?preview=true`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title={blog.status === 'published' ? 'View Article' : 'Preview Draft'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/blogs/edit/${blog.slug}`}
                          className="p-1.5 text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg transition-colors"
                          title="Edit Article"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.slug, blog.title)}
                          className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}