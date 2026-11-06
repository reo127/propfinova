'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Navber from '../components/Navber';
import Footer from '../components/Footer';
import { usePropertyStore } from '@/stores';

const DEFAULT_ABOUT_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=600&fit=crop&crop=center";
const DEFAULT_ABOUT_TITLE = "About *PropFinova*";
const DEFAULT_ABOUT_SUBTITLE = "Your trusted partner in real estate excellence, connecting dreams with reality since our inception.";

export default function AboutContent() {
    const heroImage = usePropertyStore((state) => state.heroImage);
    const fetchHeroImage = usePropertyStore((state) => state.fetchHeroImage);

    useEffect(() => {
        fetchHeroImage();
    }, [fetchHeroImage]);

    const aboutTitle = heroImage?.aboutTitle || DEFAULT_ABOUT_TITLE;

    return (
        <>
            <main className="min-h-screen bg-surface">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-r from-primary to-primary/90 text-btn-text py-20">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <img
                            src={heroImage?.aboutImage || DEFAULT_ABOUT_IMAGE}
                            alt="Modern office building"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            {/* text wrapped in *asterisks* renders in the yellow accent */}
                            {aboutTitle.split('*').map((part, i) => i % 2 ? <span key={i} className="text-yellow-300">{part}</span> : part)}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            {heroImage?.aboutSubtitle || DEFAULT_ABOUT_SUBTITLE}
                        </p>
                    </div>
                </section>

                {/* Company Story Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                    Our Story
                                </h2>
                                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                    Founded with a vision to revolutionize the real estate experience in India, PropFinova has grown from a small team of passionate professionals to one of the most trusted names in the industry.
                                </p>
                                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                    We understand that buying or selling a property is one of life's most significant decisions. That's why we've built our entire business around trust, transparency, and delivering exceptional results for our clients.
                                </p>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    Today, we're proud to serve customers across major metropolitan areas, offering comprehensive real estate solutions backed by cutting-edge technology and unmatched expertise.
                                </p>
                            </div>
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&crop=center"
                                    alt="Modern residential complex"
                                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                                />
                                <div className="absolute -bottom-6 -right-6 bg-primary text-btn-text p-6 rounded-xl shadow-xl">
                                    <div className="text-2xl font-bold">10,000+</div>
                                    <div className="text-sm">Happy Families</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Mission & Vision
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Driving innovation and excellence in real estate services
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Mission */}
                            <div className="bg-surface p-8 rounded-2xl shadow-lg">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    To provide exceptional real estate services that exceed client expectations through innovative technology, market expertise, and unwavering commitment to transparency. We strive to make property transactions seamless, secure, and stress-free for every client we serve.
                                </p>
                            </div>

                            {/* Vision */}
                            <div className="bg-surface p-8 rounded-2xl shadow-lg">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    To become India's most trusted and innovative real estate platform, setting new standards in customer service and digital transformation. We envision a future where every property transaction is transparent, efficient, and empowering for all stakeholders.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Our Core Values
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Transparency */}
                            <div className="text-center group hover:scale-105 transition-transform duration-300">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20">
                                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Transparency</h3>
                                <p className="text-gray-700">
                                    Clear, honest communication and complete transparency in all our dealings. No hidden fees, no surprises.
                                </p>
                            </div>

                            {/* Excellence */}
                            <div className="text-center group hover:scale-105 transition-transform duration-300">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20">
                                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Excellence</h3>
                                <p className="text-gray-700">
                                    Continuous pursuit of excellence in service delivery, innovation, and customer satisfaction.
                                </p>
                            </div>

                            {/* Integrity */}
                            <div className="text-center group hover:scale-105 transition-transform duration-300">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20">
                                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Integrity</h3>
                                <p className="text-gray-700">
                                    Ethical business practices and moral principles form the foundation of our operations.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className="py-16 bg-primary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Our Impact in Numbers
                            </h2>
                            <p className="text-xl text-white/90">
                                Trusted by thousands, proven by results
                            </p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">10,000+</div>
                                <div className="text-white/90 font-medium">Happy Families</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">₹500Cr+</div>
                                <div className="text-white/90 font-medium">Properties Sold</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">15+</div>
                                <div className="text-white/90 font-medium">Cities Covered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">5+</div>
                                <div className="text-white/90 font-medium">Years of Excellence</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Meet Our Leadership
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Experienced professionals dedicated to your success
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden">
                                    T
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">TBD Name</h3>
                                <p className="text-primary font-medium mb-1">TBD Title</p>
                                <p className="text-gray-500 text-sm mb-4 flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> TBD City
                                </p>
                                <p className="text-gray-700 text-sm">
                                    Leading the vision and strategy for PropFinova's continued growth.
                                </p>
                            </div>

<div className="text-center bg-surface p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden">
                                    T
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">TBD Name</h3>
                                <p className="text-primary font-medium mb-1">TBD Title</p>
                                <p className="text-gray-500 text-sm mb-4 flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> TBD City
                                </p>
                                <p className="text-gray-700 text-sm">
                                    Expert in proptech innovation and digital transformation in real estate.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Why Choose PropFinova?
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Experience the difference that sets us apart from the competition
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Verified Properties</h3>
                                <p className="text-gray-700 text-sm">Every property is thoroughly verified and legally cleared before listing.</p>
                            </div>

                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Best Price Guarantee</h3>
                                <p className="text-gray-700 text-sm">Competitive pricing with no hidden costs or surprise charges.</p>
                            </div>

                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Prime Locations</h3>
                                <p className="text-gray-700 text-sm">Properties in the most sought-after neighborhoods and emerging areas.</p>
                            </div>

                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">24/7 Support</h3>
                                <p className="text-gray-700 text-sm">Round-the-clock customer support for all your queries and assistance.</p>
                            </div>

                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Market Analytics</h3>
                                <p className="text-gray-700 text-sm">Data-driven insights to help you make informed investment decisions.</p>
                            </div>

                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Processing</h3>
                                <p className="text-gray-700 text-sm">Streamlined processes for faster property transactions and approvals.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-3xl p-8 md:p-12 text-center text-btn-text">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Find Your Dream Property?
                            </h2>
                            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                                Let our expert team guide you through every step of your real estate journey. From finding the perfect property to closing the deal, we're with you all the way.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="/search"
                                    className="px-8 py-4 bg-surface text-primary font-semibold rounded-xl hover:bg-surface/90 transition-colors shadow-lg"
                                >
                                    Explore Properties
                                </a>
                                <a
                                    href="tel:8250230198"
                                    className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-surface hover:text-primary transition-colors"
                                >
                                    Call Now: 8250230198
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}