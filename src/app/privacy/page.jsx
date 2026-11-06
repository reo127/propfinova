'use client';

import React from 'react';
import Footer from '../components/Footer';

export default function Privacy() {
    return (
        <>
            <main className="min-h-screen bg-surface">
                {/* Header */}
                <section className="bg-primary text-btn-text py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-white/90">
                            Last updated: January 2025
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="prose prose-lg max-w-none">

                            {/* Introduction */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    PropFinova (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy. This Privacy Policy explains what information we collect when you use our website and services, how we use it, and the choices you have.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    By using our platform, you agree to the practices described in this policy. If you do not agree, please do not use our services.
                                </p>
                            </div>

                            {/* Information We Collect */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
                                <div className="space-y-4 text-gray-700">
                                    <div>
                                        <strong className="text-gray-900">Information you provide:</strong> name, email address, phone number, and any details you submit when registering, listing a property, enquiring about a property, or contacting us.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">Property information:</strong> listing details, photographs, pricing, and location data you upload to the platform.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">Usage information:</strong> pages viewed, searches performed, properties saved, device and browser type, and IP address.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">Cookies:</strong> small files used to keep you signed in and remember your preferences. See Section 6.
                                    </div>
                                </div>
                            </div>

                            {/* How We Use Information */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Your Information</h2>
                                <ul className="space-y-2 text-gray-700 list-disc pl-6">
                                    <li>To create and manage your account and authenticate you.</li>
                                    <li>To publish property listings and connect buyers, sellers, and agents.</li>
                                    <li>To respond to your enquiries and provide customer support.</li>
                                    <li>To personalise search results and recommend relevant properties.</li>
                                    <li>To send service updates and, where you have opted in, marketing communications.</li>
                                    <li>To detect fraud, prevent misuse, and keep the platform secure.</li>
                                    <li>To comply with applicable laws and legal requests.</li>
                                </ul>
                            </div>

                            {/* Sharing */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. How We Share Your Information</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        We do not sell your personal information. We share it only in these situations:
                                    </p>
                                    <ul className="space-y-2 list-disc pl-6">
                                        <li><strong className="text-gray-900">With agents and property owners</strong> when you submit an enquiry, so they can respond to you.</li>
                                        <li><strong className="text-gray-900">With service providers</strong> such as hosting, email, analytics, and payment partners who process data on our behalf.</li>
                                        <li><strong className="text-gray-900">For legal reasons,</strong> where required by law or to protect our rights, users, or the public.</li>
                                        <li><strong className="text-gray-900">In a business transfer,</strong> such as a merger or acquisition, subject to this policy.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Data Retention */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Data Retention</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    We keep your information for as long as your account is active or as needed to provide our services, resolve disputes, and meet legal and accounting obligations. When it is no longer needed, we delete or anonymise it.
                                </p>
                            </div>

                            {/* Cookies */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Cookies and Tracking</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the platform is used. You can block or delete cookies through your browser settings.
                                    </p>
                                    <p>
                                        Disabling cookies may affect features such as saved searches, shortlists, and staying logged in.
                                    </p>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Data Security</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    We use reasonable technical and organisational measures to protect your information against unauthorised access, alteration, or disclosure. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.
                                </p>
                            </div>

                            {/* Your Rights */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Your Rights and Choices</h2>
                                <ul className="space-y-2 text-gray-700 list-disc pl-6">
                                    <li>Access the personal information we hold about you.</li>
                                    <li>Correct information that is inaccurate or incomplete.</li>
                                    <li>Request deletion of your account and associated data.</li>
                                    <li>Withdraw consent and unsubscribe from marketing messages at any time.</li>
                                    <li>Object to or restrict certain processing of your data.</li>
                                </ul>
                                <p className="text-gray-700 leading-relaxed mt-4">
                                    To exercise any of these rights, contact us using the details in Section 11.
                                </p>
                            </div>

                            {/* Third Party Links */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Third-Party Links</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    Our platform may link to third-party websites and services. We are not responsible for their privacy practices, and we encourage you to read their privacy policies before sharing information with them.
                                </p>
                            </div>

                            {/* Children */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Children&apos;s Privacy</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    Our services are not intended for anyone under 18. We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.
                                </p>
                            </div>

                            {/* Contact */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Contact Us</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        If you have questions about this Privacy Policy or how we handle your data, please contact us:
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-lg space-y-1">
                                        <p><strong>PropFinova Pvt Ltd</strong></p>
                                        <p>Email: TBD</p>
                                        <p>Phone: TBD</p>
                                        <p>Address: TBD</p>
                                    </div>
                                </div>
                            </div>

                            {/* Changes */}
                            <div className="bg-primary/5 p-8 rounded-xl border border-primary/20">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Policy</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    We may update this Privacy Policy from time to time. Material changes will be posted on this page with a revised &ldquo;Last updated&rdquo; date. Continued use of our services after an update means you accept the revised policy.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
