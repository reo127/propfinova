import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import BlogPostClient from './BlogPostClient';

async function getBlogData(slug) {
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug, status: 'published' })
      .populate('author', 'name email')
      .lean();

    if (!blog) return null;

    // Increment views server-side
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    // Get related blogs
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      categories: { $in: blog.categories },
    })
      .select('title slug excerpt featuredImage publishedAt readingTime categories')
      .limit(3)
      .lean();

    return JSON.parse(JSON.stringify({ blog, relatedBlogs }));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await getBlogData(params.slug);

  if (!data) {
    return { title: 'Blog Post Not Found | PropFinova' };
  }

  const { blog } = data;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.propfinova.com';
  const url = `${baseUrl}/blog/${params.slug}`;
  const title = blog.seo?.metaTitle || blog.title;
  const description = blog.seo?.metaDescription || '';
  const image = blog.featuredImage || null;

  return {
    title,
    description,
    keywords: blog.seo?.keywords?.join(', ') || '',
    alternates: { canonical: blog.seo?.canonicalUrl || url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'PropFinova',
      publishedTime: blog.publishedAt,
      authors: [blog.author?.name || 'PropFinova Team'],
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function BlogPostPage({ params }) {
  const initialData = await getBlogData(params.slug);

  return <BlogPostClient initialData={initialData} />;
}
