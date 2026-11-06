import { connectDB } from '@/lib/db';
import Property from '@/models/Property';
import HomeComponent from "./components/Home";

async function getInitialProperties() {
  try {
    await connectDB();
    const properties = await Property.find({ status: 'approved' })
      .select('_id title location price type bhk gallery mode createdAt')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    return JSON.parse(JSON.stringify(properties));
  } catch {
    return [];
  }
}

export const metadata = {
  title: "PropFinova — Buy, Sell & Rent Verified Properties in Bangalore | Built on Trust",
  description: "Discover 5,000+ verified properties in Bangalore with PropFinova. Browse apartments, villas, plots & new projects from top builders. Expert guidance for buying, selling & renting. RERA registered.",
  alternates: {
    canonical: "https://www.propfinova.com",
  },
  openGraph: {
    title: "PropFinova — Buy, Sell & Rent Verified Properties in Bangalore",
    description: "Discover 5,000+ verified properties in Bangalore. Browse apartments, villas, plots & new projects from top builders.",
    url: "https://www.propfinova.com",
    type: "website",
  },
};

export default async function Home() {
  const initialProperties = await getInitialProperties();
  return <HomeComponent initialProperties={initialProperties} />;
}
