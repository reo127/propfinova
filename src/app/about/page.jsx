import AboutContent from './AboutContent';

export const metadata = {
  title: "About PropFinova — RERA Registered Real Estate Agency in Bangalore",
  description: "PropFinova is a trusted, RERA-registered real estate agency in Bangalore. 5+ years of experience, 10,000+ happy families, ₹500Cr+ properties sold. Meet our team and learn our story.",
  alternates: {
    canonical: "https://www.propfinova.com/about",
  },
  openGraph: {
    title: "About PropFinova — Trusted Real Estate Agency in Bangalore",
    description: "RERA-registered real estate agency with 5+ years experience. 10,000+ happy families, ₹500Cr+ properties sold across Bangalore.",
    url: "https://www.propfinova.com/about",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
