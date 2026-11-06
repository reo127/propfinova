import {
  Geist_Mono,
  Plus_Jakarta_Sans,
  Inter,
  Manrope,
  DM_Sans,
  Outfit,
  Poppins,
  Sora,
  Fraunces,
  Playfair_Display,
  Lora,
} from "next/font/google";
import Script from "next/script";
import { unstable_cache } from "next/cache";
import "./globals.css";
import Navber from "./components/Navber";
// import ChatBot from "./components/ChatBot";
import FloatingContact from "./components/FloatingContact";
import { Analytics } from "@vercel/analytics/next";
import connectToDatabase from "@/lib/mongodb";
import Theme from "@/models/Theme";
import { DEFAULT_THEME, normalizeTheme, themeToCssVars } from "@/lib/themeTokens";

// Admin-set theme. Every colour and font in the app resolves through the
// custom properties written into the <style> tag below, so saving in
// Settings > Theme & Colours restyles the whole site with no code change.
// Wrapped in unstable_cache with a tag, and that tag is the whole point:
// most pages here are statically prerendered, so without it the theme read at
// build time gets frozen into the HTML and saving in Settings has no visible
// effect until the next deploy. The tag makes every page that renders this
// layout depend on 'theme', so revalidateTag('theme') in the PUT handler
// (src/app/api/theme/route.js) regenerates them on the next request.
const getTheme = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const theme = await Theme.findOne({}).lean();
      return normalizeTheme(theme);
    } catch {
      return DEFAULT_THEME;
    }
  },
  ['site-theme'],
  { tags: ['theme'] }
);

/* The curated font set offered in Settings. Each entry only declares its
   @font-face + CSS variable; `preload: false` keeps Next from emitting a
   preload <link> for all ten, and only the two families the admin selected
   get their variable class attached to <html>, so the other eight never
   download. Adding a font here means adding it to FONT_OPTIONS too.

   next/font requires every loader to be a direct call assigned to its own
   module-scope const with literal options — hence the repetition instead of
   a loop or a shared options object. */
const fontJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-jakarta", weight: ["300", "400", "500", "600", "700", "800"] });
const fontInter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter", weight: ["300", "400", "500", "600", "700"] });
const fontManrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-manrope", weight: ["300", "400", "500", "600", "700", "800"] });
const fontDmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dmsans", weight: ["300", "400", "500", "600", "700"] });
const fontOutfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit", weight: ["300", "400", "500", "600", "700"] });
const fontPoppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-poppins", weight: ["300", "400", "500", "600", "700"] });
const fontSora = Sora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-sora", weight: ["300", "400", "500", "600", "700"] });
const fontFraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-fraunces", weight: ["400", "500", "600", "700"] });
const fontPlayfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair", weight: ["400", "500", "600", "700"] });
const fontLora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora", weight: ["400", "500", "600", "700"] });

// Keyed by the same keys FONT_OPTIONS uses, so a stored theme maps straight
// through to the class that mounts the family.
const FONTS = {
  jakarta: fontJakarta,
  inter: fontInter,
  manrope: fontManrope,
  dmsans: fontDmSans,
  outfit: fontOutfit,
  poppins: fontPoppins,
  sora: fontSora,
  fraunces: fontFraunces,
  playfair: fontPlayfair,
  lora: fontLora,
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata = {
  title: "PropFinova - Premium Property Solutions",
  description: "Discover premium properties, new projects, and verified listings with PropFinova. Your trusted partner for buying, selling, and renting properties across India.",
  keywords: "real estate, property, buy property, rent property, new projects, verified listings, PropFinova, premium properties, India",
  authors: [{ name: "PropFinova" }],
  creator: "PropFinova",
  publisher: "PropFinova",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/propfinova-icon.png", type: "image/png" },
      { url: "/propfinova-icon.png" },
    ],
    apple: "/propfinova-icon.png",
  },
  openGraph: {
    title: "PropFinova - Premium Property Solutions | Built on Trust",
    description: "Discover premium properties, new projects, and verified listings with PropFinova. Your trusted partner for buying, selling, and renting properties across India.",
    url: "https://propfinova.com",
    siteName: "PropFinova",
    images: [
      {
        url: "/propfinova-logo.png",
        // url: "/propfinova-logo.png",

        width: 1200,
        height: 600,
        alt: "PropFinova - Built on Trust",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropFinova - Premium Property Solutions",
    description: "Discover premium properties, new projects, and verified listings with PropFinova. Your trusted partner for buying, selling, and renting properties across India.",
    images: ["/propfinova-logo.png"],
    // images: ["/propfinova-logo.png"],

  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({ children }) {
  const theme = await getTheme();

  // Only the selected families are mounted, so the rest never get fetched.
  const fontClasses = [
    FONTS[theme.fontBody]?.variable,
    FONTS[theme.fontHeading]?.variable,
    geistMono.variable,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={fontClasses}>
      <head>
        {/* Every value here is hex/enum-validated by normalizeTheme first */}
        <style dangerouslySetInnerHTML={{ __html: themeToCssVars(theme) }} />
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5M99MMM8');
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17580329809"
        ></Script>
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17580329809');
            gtag('config', 'G-3MYC2LLS31');
          `}
        </Script>
        {/* ContentSquare / Hotjar Analytics */}
        <Script
          src="https://t.contentsquare.net/uxa/78bbf96b8c928.js"
          strategy="afterInteractive"
        />
        <link rel="icon" href="/propfinova-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/propfinova-icon.png" />
        {/* Browser chrome follows the admin's primary colour too */}
        <meta name="theme-color" content={theme.primary} />
        <meta name="msapplication-TileColor" content={theme.primary} />
        <meta name="msapplication-TileImage" content="/propfinova-icon.png" />
        <meta property="og:image" content="/propfinova-logo.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="600" />
        <meta name="twitter:image" content="/propfinova-logo.png" />
        <link rel="shortcut icon" href="/propfinova-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className="font-sans antialiased"
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5M99MMM8"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* Organization + WebSite Structured Data — helps Google & AI assistants understand PropFinova */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "RealEstateAgent",
                  "@id": "https://www.propfinova.com/#organization",
                  "name": "PropFinova",
                  "alternateName": "PropFinova",
                  "url": "https://www.propfinova.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.propfinova.com/propfinova-logo.png",
                    "width": 200,
                    "height": 60
                  },
                  "image": "https://www.propfinova.com/propfinova-logo.png",
                  "description": "PropFinova is a premium real estate agency offering verified property listings, new residential projects, and expert guidance for buying, selling, and renting properties across India.",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "TBD",
                    "addressLocality": "TBD",
                    "addressRegion": "TBD",
                    "postalCode": "000000",
                    "addressCountry": "IN"
                  },
                  "telephone": "TBD",
                  "contactPoint": [
                    {
                      "@type": "ContactPoint",
                      "telephone": "TBD",
                      "contactType": "sales",
                      "areaServed": "IN",
                      "availableLanguage": ["English", "Hindi"]
                    }
                  ],
                  "knowsAbout": ["Real Estate", "Property Investment", "Residential Properties", "New Projects", "Apartments", "Villas", "Plots"],
                  "slogan": "Built on Trust",
                  "sameAs": [
                    "https://www.propfinova.com"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.propfinova.com/#website",
                  "url": "https://www.propfinova.com",
                  "name": "PropFinova",
                  "description": "Premium Property Solutions — Buy, Sell & Rent Verified Properties in India",
                  "publisher": { "@id": "https://www.propfinova.com/#organization" },
                  "inLanguage": "en-IN",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://www.propfinova.com/search?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
        <Navber/>
        {children}
        <Analytics />
        {/* <ChatBot/> */}
        <FloatingContact/>
      </body>
    </html>
  );
}
