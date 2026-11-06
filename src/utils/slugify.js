/**
 * Generate a URL-friendly slug from a property title
 * @param {string} title - The property title
 * @returns {string} - URL-safe slug
 *
 * Example: "3BHK Luxury Apartment in Bandra, Mumbai"
 * becomes "3bhk-luxury-apartment-in-bandra-mumbai"
 */
export function generateSlug(title) {
  if (!title) return 'property';

  return title
    .toLowerCase()
    .trim()
    // Remove special characters and emojis
    .replace(/[^\w\s-]/g, '')
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length for clean URLs (max 100 characters)
    .substring(0, 100)
    // Remove trailing hyphen if substring cut in middle
    .replace(/-+$/, '');
}

/**
 * Generate a property URL with slug and ID
 * @param {Object} property - Property object with _id and title
 * @returns {string} - Complete property URL path
 */
export function generatePropertyUrl(property) {
  if (!property || !property._id) return '/';

  const slug = generateSlug(property.title);
  return `/property/${slug}/${property._id}`;
}
