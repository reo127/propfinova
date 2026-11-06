import { connectDB } from '@/lib/db';
import Property from '@/models/Property';
import Blog from '@/models/Blog';
import { generateSlug } from '@/utils/slugify';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.propfinova.com';

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  try {
    // Connect to database
    await connectDB();

    // Get all approved properties
    const properties = await Property.find({ status: 'approved' })
      .select('_id title createdAt')
      .lean();

    const propertyRoutes = properties.map((property) => {
      const slug = generateSlug(property.title);
      return {
        url: `${baseUrl}/property/${slug}/${property._id}`,
        lastModified: property.createdAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    // Get all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug publishedAt updatedAt')
      .lean();

    const blogRoutes = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt || blog.publishedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // Combine all routes
    return [...staticRoutes, ...propertyRoutes, ...blogRoutes];
  } catch (error) {
    // Return static routes if database connection fails
    return staticRoutes;
  }
}
