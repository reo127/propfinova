'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDE_DURATION = 5000;

export default function Banner({ banners = [] }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    // A banner row can outlive its uploaded file (e.g. the image was removed
    // from disk). Drop those slides instead of reserving 30rem of blank space
    // for a broken <img>.
    const [brokenIds, setBrokenIds] = useState([]);

    const slides = (banners || []).filter((b) => !brokenIds.includes(b._id ?? b.id));
    const slideCount = slides.length;

    // Auto-slide functionality
    useEffect(() => {
        if (slideCount <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideCount);
        }, SLIDE_DURATION);

        return () => clearInterval(timer);
    }, [slideCount, currentSlide]);

    const markBroken = (banner) => {
        const id = banner._id ?? banner.id;
        setBrokenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    // Nothing renderable — show nothing at all rather than an empty band.
    if (slideCount === 0) {
        return null;
    }

    const activeIndex = currentSlide < slideCount ? currentSlide : 0;

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slideCount);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <div className="relative overflow-hidden bg-secondary">
            {/* Banner Slides */}
            <div className="relative h-56 sm:h-80 md:h-[26rem] lg:h-[30rem]">
                {slides.map((banner, index) => (
                    <div
                        // The API returns Mongo's `_id`; `banner.id` was always
                        // undefined, so every slide shared the same key.
                        key={banner._id ?? banner.id ?? index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            index === activeIndex ? 'opacity-100 z-10' : 'opacity-0'
                        }`}
                    >
                        {banner.link ? (
                            <Link href={banner.link} className="block h-full w-full relative">
                                <BannerContent banner={banner} active={index === activeIndex} onBroken={markBroken} />
                            </Link>
                        ) : (
                            <div className="h-full w-full relative">
                                <BannerContent banner={banner} active={index === activeIndex} onBroken={markBroken} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Controls - only show if more than 1 banner */}
            {slideCount > 1 && (
                <>
                    {/* Previous/Next Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors z-20 cursor-pointer"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors z-20 cursor-pointer"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Progress Bar Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to banner ${index + 1}`}
                                className="relative h-1 w-8 sm:w-10 rounded-full bg-surface/25 overflow-hidden cursor-pointer"
                            >
                                {index === activeIndex && (
                                    <span
                                        key={activeIndex}
                                        className="absolute inset-y-0 left-0 bg-surface rounded-full"
                                        style={{ animation: `banner-progress ${SLIDE_DURATION}ms linear forwards` }}
                                    />
                                )}
                                {index < activeIndex && <span className="absolute inset-0 bg-surface rounded-full" />}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes banner-progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
}

function BannerContent({ banner, active, onBroken }) {
    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Background Image with subtle Ken Burns zoom */}
            <img
                src={banner.image}
                alt={banner.alt || banner.title || 'Banner'}
                onError={() => onBroken?.(banner)}
                className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${active ? 'scale-110' : 'scale-100'}`}
            />

            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/15 to-transparent" />

            {/* Text Overlay */}
            {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 flex items-end">
                    <div className="px-6 sm:px-10 pb-8 sm:pb-12 max-w-2xl">
                        {banner.title && (
                            <h3
                                className="text-xl sm:text-3xl md:text-4xl text-white leading-tight"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                {banner.title}
                            </h3>
                        )}
                        {banner.subtitle && (
                            <p className="mt-2 text-sm sm:text-base text-white/75">
                                {banner.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
