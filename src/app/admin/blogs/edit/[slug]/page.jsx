'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { uploadImage } from '@/lib/uploadImage';
import { ACCEPT_IMAGES } from '@/lib/uploadTypes';
import {
  FileText,
  Sparkles,
  Image as ImageIcon,
  Search,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Tag,
  Globe,
  Upload,
  Layers,
  Save
} from 'lucide-react';

// Dynamically import WYSIWYG Editor
const WYSIWYGEditor = dynamic(() => import('@/components/WYSIWYGEditor'), { ssr: false });

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    categories: '',
    tags: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
    },
    status: 'draft',
  });

  useEffect(() => {
    fetchBlog();
  }, []);

  const fetchBlog = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/blogs/${params.slug}?admin=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const blog = data.data.blog;
        setFormData({
          title: blog.title || '',
          content: blog.content || '',
          excerpt: blog.excerpt || '',
          featuredImage: blog.featuredImage || '',
          categories: (blog.categories || []).join(', '),
          tags: (blog.tags || []).join(', '),
          seo: {
            metaTitle: blog.seo?.metaTitle || '',
            metaDescription: blog.seo?.metaDescription || '',
            keywords: (blog.seo?.keywords || []).join(', '),
          },
          status: blog.status || 'draft',
        });
      } else {
        setError(data.message || 'Failed to fetch article');
      }
    } catch (error) {
      setError('Network error while retrieving article');
      console.error('Error fetching blog:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);

    try {
      const { url } = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        featuredImage: url,
      }));
    } catch (error) {
      alert(error.message);
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handlePreview = () => {
    try {
      const blogData = {
        ...formData,
        categories: formData.categories
          .split(',')
          .map((cat) => cat.trim())
          .filter((cat) => cat),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        seo: {
          ...formData.seo,
          keywords: formData.seo.keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword),
        },
      };

      localStorage.setItem('blogPreview', JSON.stringify(blogData));
      const previewUrl = '/blog/preview';
      window.open(previewUrl, '_blank');
    } catch (error) {
      setError('Failed to generate preview');
      console.error('Error generating preview:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const blogData = {
        ...formData,
        categories: formData.categories
          .split(',')
          .map((cat) => cat.trim())
          .filter((cat) => cat),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        seo: {
          ...formData.seo,
          keywords: formData.seo.keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword),
        },
      };

      const response = await fetch(`/api/blogs/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/blogs');
      } else {
        setError(data.message || 'Failed to update article');
      }
    } catch (error) {
      setError('Failed to update article');
      console.error('Error updating blog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin"></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Article Dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 antialiased">
      {/* Studio Header */}
      <div className="bg-secondary text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/blogs"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Back to Editorial Console"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Editorial Studio</span>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md">
                  Edit: {formData.title || 'Article'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePreview}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-btn-text text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Update Article'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Update Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Article Body */}
          <div className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Article Headline *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 text-lg font-bold text-slate-900 bg-surface border border-slate-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-500"
                placeholder="Article Title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lead Excerpt *
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {formData.excerpt.length}/300
                </span>
              </div>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 text-sm text-slate-900 bg-surface border border-slate-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-500"
                placeholder="Brief summary for listings and cards..."
              />
            </div>

            {/* Featured Image Section */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Featured Cover Image
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {imageUploading ? 'Uploading...' : 'Replace Image'}
                  </button>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                    className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                    placeholder="or enter direct image URL"
                  />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept={ACCEPT_IMAGES}
                  className="hidden"
                />

                {formData.featuredImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-48 sm:h-64 bg-slate-950">
                    <img
                      src={formData.featuredImage}
                      alt="Featured Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                      Cover Banner Active
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* WYSIWYG Editor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Article Narrative & Body *
              </label>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <WYSIWYGEditor
                  value={formData.content}
                  onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  placeholder="Update your article content..."
                />
              </div>
            </div>

            {/* Taxonomy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Categories (Comma Separated)
                </label>
                <input
                  type="text"
                  name="categories"
                  value={formData.categories}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                  placeholder="Real Estate, Investment, Luxury"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                  placeholder="bangalore, luxury-flats, investment"
                />
              </div>
            </div>
          </div>

          {/* SEO & Meta Optimization Card */}
          <div className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-slate-900">SEO & SERP Optimization</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-primary px-2.5 py-1 rounded-lg">
                Google Snippet Target
              </span>
            </div>

            {/* Google SERP Live Simulation */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Search Result Mockup
              </span>
              <p className="text-xs text-emerald-700 font-medium">https://propfinova.com › blog › {params.slug}</p>
              <h4 className="text-base font-bold text-blue-800 hover:underline cursor-pointer line-clamp-1">
                {formData.seo.metaTitle || formData.title} | PropFinova
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                {formData.seo.metaDescription || formData.excerpt || 'Article summary snippet for Google organic results.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meta Title *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formData.seo.metaTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  name="seo.metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={handleInputChange}
                  required
                  maxLength={60}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                  placeholder="50-60 characters optimized title"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meta Description *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formData.seo.metaDescription.length}/160
                  </span>
                </div>
                <textarea
                  name="seo.metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                  placeholder="150-160 characters summary for search engines"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  name="seo.keywords"
                  value={formData.seo.keywords}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-500"
                  placeholder="luxury properties, investment advice, bangalore real estate"
                />
              </div>
            </div>
          </div>

          {/* Publication Governance */}
          <div className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Publication Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-slate-900"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/blogs"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Article'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}