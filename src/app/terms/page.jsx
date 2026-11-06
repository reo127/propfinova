'use client';

import React from 'react';
import Footer from '../components/Footer';

export default function Terms() {
    return (
        <>
            <main className="min-h-screen bg-surface">
                {/* Header */}
                <section className="bg-primary text-btn-text py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Terms and Conditions
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
                                    Welcome to PropFinova (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of our website and services. By accessing or using our platform, you agree to comply with and be bound by these Terms.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    If you do not agree with any part of these Terms, you must not use our services.
                                </p>
                            </div>

                            {/* Definitions */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Definitions</h2>
                                <div className="space-y-4">
                                    <div>
                                        <strong className="text-gray-900">&ldquo;Platform&rdquo;</strong> refers to the PropFinova website and mobile applications.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">&ldquo;User&rdquo;</strong> refers to any individual or entity accessing our services.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">&ldquo;Property&rdquo;</strong> refers to real estate listings available on our platform.
                                    </div>
                                    <div>
                                        <strong className="text-gray-900">&ldquo;Services&rdquo;</strong> refers to all services provided by PropFinova including property listing, search, and transaction facilitation.
                                    </div>
                                </div>
                            </div>

                            {/* User Registration */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Registration and Account</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>To access certain features of our platform, you may need to create an account. You agree to:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Provide accurate, current, and complete information during registration</li>
                                        <li>Maintain the security of your password and account</li>
                                        <li>Promptly update your account information when changes occur</li>
                                        <li>Accept responsibility for all activities under your account</li>
                                        <li>Notify us immediately of any unauthorized use of your account</li>
                                    </ul>
                                    <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
                                </div>
                            </div>

                            {/* Use of Services */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Use of Services</h2>
                                <div className="space-y-4 text-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-900">4.1 Permitted Use</h3>
                                    <p>You may use our services for legitimate real estate purposes including:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Searching for properties to buy, rent, or invest</li>
                                        <li>Listing properties for sale or rent (if authorized)</li>
                                        <li>Connecting with real estate professionals</li>
                                        <li>Accessing market information and analytics</li>
                                    </ul>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mt-6">4.2 Prohibited Use</h3>
                                    <p>You agree not to:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Use the platform for any illegal or unauthorized purpose</li>
                                        <li>Post false, misleading, or fraudulent information</li>
                                        <li>Violate any laws or regulations</li>
                                        <li>Interfere with the platform&apos;s security features</li>
                                        <li>Collect user information without consent</li>
                                        <li>Use automated systems to access the platform</li>
                                        <li>Transmit viruses, malware, or harmful code</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Property Listings */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Property Listings</h2>
                                <div className="space-y-4 text-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-900">5.1 Listing Requirements</h3>
                                    <p>All property listings must:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Contain accurate and truthful information</li>
                                        <li>Include clear, recent photographs</li>
                                        <li>Comply with applicable laws and regulations</li>
                                        <li>Not contain discriminatory content</li>
                                        <li>Be for legitimate properties available for transaction</li>
                                    </ul>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mt-6">5.2 Verification</h3>
                                    <p>
                                        While we strive to verify property information, users are responsible for conducting their own due diligence. We do not guarantee the accuracy of all listing details.
                                    </p>
                                </div>
                            </div>

                            {/* Privacy and Data Protection */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Privacy and Data Protection</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                                    </p>
                                    <p>
                                        By using our services, you consent to the collection, use, and disclosure of your information as described in our Privacy Policy.
                                    </p>
                                </div>
                            </div>

                            {/* Payments and Fees */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Payments and Fees</h2>
                                <div className="space-y-4 text-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-900">7.1 Service Fees</h3>
                                    <p>
                                        Certain services may require payment of fees. All fees are clearly disclosed before you commit to any paid service.
                                    </p>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mt-4">7.2 Payment Terms</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>All payments must be made in Indian Rupees (INR)</li>
                                        <li>Fees are non-refundable unless specified otherwise</li>
                                        <li>We reserve the right to change our fee structure with notice</li>
                                        <li>Failed payments may result in service suspension</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Intellectual Property */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Intellectual Property</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        All content on our platform, including text, graphics, logos, images, and software, is owned by PropFinova or our licensors and is protected by intellectual property laws.
                                    </p>
                                    <p>
                                        You may not reproduce, distribute, modify, or create derivative works from our content without explicit written permission.
                                    </p>
                                </div>
                            </div>

                            {/* Disclaimers */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Disclaimers</h2>
                                <div className="space-y-4 text-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-900">9.1 Service Availability</h3>
                                    <p>
                                        We strive to provide uninterrupted service but do not guarantee 100% uptime. Services may be temporarily unavailable for maintenance or technical issues.
                                    </p>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mt-4">9.2 Third-Party Content</h3>
                                    <p>
                                        Our platform may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third parties.
                                    </p>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mt-4">9.3 Investment Risk</h3>
                                    <p>
                                        Real estate investments carry inherent risks. We provide information but do not provide investment advice. Consult professionals before making investment decisions.
                                    </p>
                                </div>
                            </div>

                            {/* Limitation of Liability */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Limitation of Liability</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        To the fullest extent permitted by law, PropFinova shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
                                    </p>
                                    <p>
                                        Our total liability for any claims related to our services shall not exceed the amount you paid to us in the twelve months preceding the claim.
                                    </p>
                                </div>
                            </div>

                            {/* Termination */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Termination</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        We may terminate or suspend your account and access to our services at our discretion, without notice, for conduct that violates these Terms or is harmful to other users or our business.
                                    </p>
                                    <p>
                                        You may terminate your account at any time by contacting us. Upon termination, your right to use our services ceases immediately.
                                    </p>
                                </div>
                            </div>

                            {/* Governing Law */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Governing Law and Jurisdiction</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.
                                    </p>
                                </div>
                            </div>

                            {/* Changes to Terms */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Changes to Terms</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.
                                    </p>
                                    <p>
                                        We recommend reviewing these Terms periodically to stay informed of any updates.
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">14. Contact Information</h2>
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        If you have questions about these Terms and Conditions, please contact us:
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-lg space-y-1">
                                        <p><strong>PropFinova Pvt Ltd</strong></p>
                                        <p>Email: TBD</p>
                                        <p>Phone: TBD</p>
                                        <p>Address: TBD</p>
                                    </div>
                                </div>
                            </div>

                            {/* Acceptance */}
                            <div className="bg-primary/5 p-8 rounded-xl border border-primary/20">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Acceptance of Terms</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    By using PropFinova&apos;s services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. These Terms constitute a legally binding agreement between you and PropFinova.
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