import { connectDB } from '@/lib/db';
import Property from '@/models/Property';
import Footer from "@/app/components/Footer";
import PropertyDetails from "../../../components/PropertyDetails";

async function getProperty(id) {
  try {
    await connectDB();
    const property = await Property.findById(id).lean();
    if (!property) return null;
    return JSON.parse(JSON.stringify(property));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const property = await getProperty(params.id);

  if (!property || property.status !== 'approved') {
    return { title: 'Property Not Found | PropFinova' };
  }

  const bhkStr = property.bhk ? `${property.bhk.toUpperCase()} ` : '';
  const typeStr = property.type ? property.type.replace(/-/g, ' ') : 'Property';
  const title = `${property.title} - ${bhkStr}${typeStr} in ${property.location} | PropFinova`;

  const description = property.description
    ? property.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `${bhkStr}${typeStr} in ${property.location} at ${property.price}. Explore premium real estate listings at PropFinova.`;

  const image = property.gallery?.[0] || null;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.propfinova.com';
  const url = `${baseUrl}/property/${params.slug}/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'PropFinova',
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: property.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function PropertyPage({ params }) {
  const property = await getProperty(params.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.propfinova.com';
  const url = `${baseUrl}/property/${params.slug}/${params.id}`;

  const bhkStr = property?.bhk ? `${property.bhk.toUpperCase()} ` : '';
  const typeStr = property?.type ? property.type.replace(/-/g, ' ') : 'Property';

  // RealEstateListing + Breadcrumb structured data
  const structuredData = property ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        "name": property.title,
        "description": property.description
          ? property.description.replace(/<[^>]*>/g, '').substring(0, 500)
          : `${bhkStr}${typeStr} in ${property.location}`,
        "url": url,
        "image": property.gallery?.slice(0, 5) || [],
        "datePosted": property.createdAt,
        "price": property.price,
        "priceCurrency": "INR",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": property.location,
          "addressRegion": "Karnataka",
          "addressCountry": "IN"
        },
        "floorSize": property.area ? {
          "@type": "QuantitativeValue",
          "value": property.area,
          "unitCode": "FTK"
        } : undefined,
        "numberOfRooms": property.bhk ? property.bhk.replace(/[^0-9.]/g, '') : undefined,
        "offers": {
          "@type": "Offer",
          "price": property.price,
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": "https://www.propfinova.com/#organization" }
        },
        "provider": { "@id": "https://www.propfinova.com/#organization" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
          { "@type": "ListItem", "position": 2, "name": "Search Properties", "item": `${baseUrl}/search` },
          { "@type": "ListItem", "position": 3, "name": property.location, "item": `${baseUrl}/search?location=${encodeURIComponent(property.location)}` },
          { "@type": "ListItem", "position": 4, "name": property.title, "item": url }
        ]
      }
    ]
  } : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <PropertyDetails initialData={property} />
      <Footer />
    </>
  );
}
