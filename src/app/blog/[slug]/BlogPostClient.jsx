'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate, getTimeAgo } from '../../../utils/dateUtils';
import Head from 'next/head';

export default function BlogPostClient({ initialData = null }) {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState(initialData?.blog || null);
  const [relatedBlogs, setRelatedBlogs] = useState(initialData?.relatedBlogs || []);
  const [loading, setLoading] = useState(initialData === null);
  const [error, setError] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    // Skip client fetch if server already provided data (not preview mode)
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    setIsPreviewMode(isPreview);

    if (initialData && !isPreview) return;

    fetchBlog();
  }, [params.slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);

      // Check if this is a preview mode
      const urlParams = new URLSearchParams(window.location.search);
      const isPreview = urlParams.get('preview') === 'true';
      setIsPreviewMode(isPreview);

      // Prepare headers
      const headers = {};
      if (isPreview) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Build URL with preview parameter if needed
      const url = isPreview ? `/api/blogs/${params.slug}?preview=true` : `/api/blogs/${params.slug}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.success) {
        setBlog(data.data.blog);
        setRelatedBlogs(data.data.relatedBlogs || []);

        // Update page title and meta tags
        document.title = data.data.blog.seo.metaTitle;
        updateMetaTags(data.data.blog);
      } else {
        setError(data.message);
        if (response.status === 404) {
          router.push('/blog');
        }
      }
    } catch (error) {
      setError('Failed to fetch blog post');
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMetaTags = (blogData) => {
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', blogData.seo.metaDescription);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', blogData.seo.metaDescription);
      document.head.appendChild(metaDescription);
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', blogData.seo.keywords.join(', '));
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', blogData.seo.keywords.join(', '));
      document.head.appendChild(metaKeywords);
    }

    // Update Open Graph tags
    updateOrCreateMetaTag('property', 'og:title', blogData.seo.metaTitle);
    updateOrCreateMetaTag('property', 'og:description', blogData.seo.metaDescription);
    updateOrCreateMetaTag('property', 'og:type', 'article');
    updateOrCreateMetaTag('property', 'og:url', window.location.href);
    if (blogData.featuredImage) {
      updateOrCreateMetaTag('property', 'og:image', blogData.featuredImage);
    }

    // Update Twitter Card tags
    updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('name', 'twitter:title', blogData.seo.metaTitle);
    updateOrCreateMetaTag('name', 'twitter:description', blogData.seo.metaDescription);
    if (blogData.featuredImage) {
      updateOrCreateMetaTag('name', 'twitter:image', blogData.featuredImage);
    }

    // Add structured data for articles
    addStructuredData(blogData);
  };

  const updateOrCreateMetaTag = (attribute, name, content) => {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (tag) {
      tag.setAttribute('content', content);
    } else {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
  };

  const addStructuredData = (blogData) => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blogData.title,
      "description": blogData.excerpt,
      "image": blogData.featuredImage,
      "author": {
        "@type": "Person",
        "name": blogData.author?.name || "PropFinova Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "PropFinova",
        "logo": {
          "@type": "ImageObject",
          "url": "/propfinova-logo.png"
        }
      },
      "datePublished": blogData.publishedAt || blogData.createdAt,
      "dateModified": blogData.updatedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (scriptTag) {
      scriptTag.textContent = JSON.stringify(structuredData);
    } else {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The blog post you\'re looking for doesn\'t exist.'}</p>
          <Link
            href="/blog"
            className="px-6 py-3 bg-primary text-btn-text font-medium rounded-lg hover:bg-primary/90"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{blog.seo.metaTitle}</title>
        <meta name="description" content={blog.seo.metaDescription} />
        <meta name="keywords" content={blog.seo.keywords.join(', ')} />
        <meta property="og:title" content={blog.seo.metaTitle} />
        <meta property="og:description" content={blog.seo.metaDescription} />
        <meta property="og:type" content="article" />
        {blog.featuredImage && <meta property="og:image" content={blog.featuredImage} />}
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Preview Banner */}
        {isPreviewMode && (
          <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">
                    Preview Mode - This blog is not published yet
                  </span>
                </div>
                <Link
                  href="/admin/blogs"
                  className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                >
                  Back to Blog Management
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Breadcrumb */}
        <div className="bg-surface border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link href="/blog" className="text-gray-500 hover:text-gray-700">Blog</Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">{blog.title}</span>
            </nav>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Article Header */}
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.categories.map(category => (
                <span
                  key={category}
                  className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {blog.author?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {blog.author?.name || 'PropFinova Team'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(blog.publishedAt || blog.createdAt)} • {blog.readingTime} min read
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {blog.views || 0} views
              </div>
            </div>

            {blog.featuredImage && (
              <div className="mb-10">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            )}
          </header>

          {/* Article Content */}
          <div 
            className="prose text-black prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-medium text-primary">
                  {blog.author?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {blog.author?.name || 'PropFinova Team'}
                </h3>
                <p className="text-gray-600">
                  Expert real estate professionals helping you make informed property decisions. 
                  Follow our insights for market trends, investment tips, and property guidance.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section className="bg-surface border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Related Articles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedBlogs.map(relatedBlog => (
                  <article
                    key={relatedBlog._id}
                    className="bg-surface rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    <Link href={`/blog/${relatedBlog.slug}`}>
                      <div className="cursor-pointer">
                        {relatedBlog.featuredImage && (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={relatedBlog.featuredImage}
                              alt={relatedBlog.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
                            {relatedBlog.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {relatedBlog.excerpt}
                          </p>
                          
                          <div className="text-sm text-gray-500">
                            {formatDate(relatedBlog.publishedAt)} • {relatedBlog.readingTime} min read
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-primary text-btn-text">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Explore our extensive collection of properties and let our experts guide you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="px-8 py-3 bg-surface text-primary font-medium rounded-lg hover:bg-surface/90 transition-colors"
              >
                Search Properties
              </Link>
              <Link
                href="/blog"
                className="px-8 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Read More Articles
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}