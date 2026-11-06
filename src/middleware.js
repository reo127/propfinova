import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the URL matches the old property URL pattern: /property/[id]
  // Old pattern: /property/507f1f77bcf86cd799439011
  // New pattern: /property/luxury-villa-mumbai/507f1f77bcf86cd799439011
  const oldPropertyPattern = /^\/property\/([a-f0-9]{24})$/i;
  const match = pathname.match(oldPropertyPattern);

  if (match) {
    const propertyId = match[1];

    // Fetch the property to get its title for generating the slug
    try {
      // Use the API to get property details
      const baseUrl = request.nextUrl.origin;
      const apiUrl = `${baseUrl}/api/properties/${propertyId}`;

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        const property = data.data;

        // Generate slug from property title
        const slug = generateSlugForMiddleware(property.title);

        // Redirect to new URL format
        const newUrl = new URL(`/property/${slug}/${propertyId}`, request.url);
        return NextResponse.redirect(newUrl, 301); // 301 = Permanent redirect
      }
    } catch (error) {
      console.error('Error fetching property for redirect:', error);
      // If fetch fails, try to redirect to a generic slug
      const newUrl = new URL(`/property/view/${propertyId}`, request.url);
      return NextResponse.redirect(newUrl, 301);
    }
  }

  return NextResponse.next();
}

// Duplicate of the slugify function to avoid importing issues in middleware
function generateSlugForMiddleware(title) {
  if (!title) return 'property';

  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
    .replace(/-+$/, '');
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    '/property/:path*',
  ],
};
