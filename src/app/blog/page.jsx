import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import BlogListingContent from './BlogListingContent';

const BLOGS_PER_PAGE = 9;

async function getInitialBlogs() {
  try {
    await connectDB();
    const total = await Blog.countDocuments({ status: 'published' });
    const blogs = await Blog.find({ status: 'published' })
      .select('title slug excerpt featuredImage publishedAt categories readingTime author')
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .limit(BLOGS_PER_PAGE)
      .lean();

    return {
      blogs: JSON.parse(JSON.stringify(blogs)),
      totalPages: Math.ceil(total / BLOGS_PER_PAGE),
    };
  } catch (err) {
    console.error('Blog fetch error:', err.message);
    return { blogs: [], totalPages: 1 };
  }
}

export const metadata = {
  title: "Real Estate Blog — Property Tips, Market Trends & Investment Guide | PropFinova",
  description: "Expert real estate insights from PropFinova. Read property investment tips, Bangalore market trends, home buying guides, and legal advice for buyers and sellers.",
  alternates: {
    canonical: "https://www.propfinova.com/blog",
  },
  openGraph: {
    title: "Real Estate Blog — Property Tips & Market Trends | PropFinova",
    description: "Expert insights on Bangalore real estate — investment tips, market trends, home buying guides.",
    url: "https://www.propfinova.com/blog",
    type: "website",
  },
};

export default async function BlogPage() {
  const { blogs, totalPages } = await getInitialBlogs();
  return <BlogListingContent initialBlogs={blogs} initialTotalPages={totalPages} />;
}
