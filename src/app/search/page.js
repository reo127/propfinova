import { Suspense } from "react";
import Footer from "../components/Footer";
import PropertyList from "./components/PropertyList";
import MobileStickyCTA from "../components/MobileStickyCTA";

export const metadata = {
  title: "Search Properties in Bangalore — Buy, Rent & New Projects | PropFinova",
  description: "Search verified properties in Bangalore. Filter by location, price, BHK, type — apartments, villas, plots, new projects. Find your dream home with PropFinova.",
  alternates: {
    canonical: "https://www.propfinova.com/search",
  },
  openGraph: {
    title: "Search Properties in Bangalore — PropFinova",
    description: "Browse 5,000+ verified properties. Filter by apartments, villas, plots, new projects across Bangalore.",
    url: "https://www.propfinova.com/search",
    type: "website",
  },
};

function SearchFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="text-secondary/50 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Loading search results...</p>
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <div className={`min-h-screen bg-background pb-20 lg:pb-0`}>
      <MobileStickyCTA />
      <Suspense fallback={<SearchFallback />}>
        <PropertyList/>
      </Suspense>
      <Footer/>
    </div>
  );
}
