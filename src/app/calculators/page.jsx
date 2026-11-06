"use client";

import { useState } from 'react';
import EMICalculator from '../components/EMICalculatorV2';
import Footer from '../components/Footer';
import { Calculator, Home, TrendingUp, PiggyBank, ChevronRight } from 'lucide-react';

export default function CalculatorsPage() {
    const [activeCalculator, setActiveCalculator] = useState('emi');

    const calculators = [
        {
            id: 'emi',
            name: 'EMI Calculator',
            icon: Calculator,
            description: 'Calculate your home loan EMI with detailed breakdown',
            available: true,
            color: 'from-primary to-primary-light'
        },
        {
            id: 'affordability',
            name: 'Home Affordability Calculator',
            icon: Home,
            description: 'Find out how much home you can afford',
            available: false,
            color: 'from-blue-500 to-blue-600',
            comingSoon: true
        },
        {
            id: 'roi',
            name: 'Property ROI Calculator',
            icon: TrendingUp,
            description: 'Calculate return on investment for properties',
            available: false,
            color: 'from-primary to-primary-dark',
            comingSoon: true
        },
        {
            id: 'savings',
            name: 'Down Payment Calculator',
            icon: PiggyBank,
            description: 'Plan your savings for down payment',
            available: false,
            color: 'from-purple-500 to-purple-600',
            comingSoon: true
        }
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-primary to-primary-light text-btn-text">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Calculator className="w-12 h-12" />
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                                    Property Calculators
                                </h1>
                            </div>
                            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
                                Smart tools to help you make informed real estate decisions
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {/* Calculator Selection Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        {calculators.map((calc) => {
                            const Icon = calc.icon;
                            return (
                                <button
                                    key={calc.id}
                                    onClick={() => calc.available && setActiveCalculator(calc.id)}
                                    disabled={!calc.available}
                                    className={`relative group text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                                        activeCalculator === calc.id
                                            ? 'border-primary bg-surface shadow-lg scale-105'
                                            : calc.available
                                            ? 'border-gray-200 bg-surface hover:border-primary/50 hover:shadow-md'
                                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    {calc.comingSoon && (
                                        <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                            Coming Soon
                                        </span>
                                    )}

                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${calc.color} flex items-center justify-center mb-4 ${
                                        activeCalculator === calc.id ? 'shadow-lg' : ''
                                    }`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">
                                        {calc.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {calc.description}
                                    </p>

                                    {activeCalculator === calc.id && (
                                        <div className="absolute bottom-3 right-3">
                                            <ChevronRight className="w-5 h-5 text-primary" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Calculator Display */}
                    <div className="animate-fadeIn">
                        {activeCalculator === 'emi' && (
                            <div>
                                <EMICalculator
                                    defaultPrice={5000000}
                                    minPrice={1000000}
                                    maxPrice={100000000}
                                    showPriceSlider={false}
                                    embedded={false}
                                />
                            </div>
                        )}

                        {activeCalculator === 'affordability' && (
                            <div className="bg-surface rounded-2xl shadow-xl p-12 text-center">
                                <Home className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Home Affordability Calculator</h3>
                                <p className="text-gray-600">Coming soon! This calculator will help you determine how much home you can afford.</p>
                            </div>
                        )}

                        {activeCalculator === 'roi' && (
                            <div className="bg-surface rounded-2xl shadow-xl p-12 text-center">
                                <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Property ROI Calculator</h3>
                                <p className="text-gray-600">Coming soon! Calculate potential returns on your property investment.</p>
                            </div>
                        )}

                        {activeCalculator === 'savings' && (
                            <div className="bg-surface rounded-2xl shadow-xl p-12 text-center">
                                <PiggyBank className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Down Payment Calculator</h3>
                                <p className="text-gray-600">Coming soon! Plan and track your savings for the perfect down payment.</p>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="mt-12 bg-gradient-to-br from-blue-50 to-primary-soft rounded-2xl p-6 sm:p-8 border border-blue-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Why Use Our Calculators?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Accurate Results</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Get precise calculations based on industry-standard formulas
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Easy to Use</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Intuitive sliders and inputs make calculations simple
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Instant Updates</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    See results change in real-time as you adjust parameters
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Visual Breakdown</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Understand your payments with clear charts and graphs
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Mobile Friendly</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Calculate on any device, anywhere, anytime
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900">Free to Use</h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                    All our calculators are completely free, no hidden costs
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
            `}</style>
        </>
    );
}
