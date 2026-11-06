"use client";

import { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, PieChart, DollarSign } from 'lucide-react';

const formatCurrency = (amount) => {
    if (!amount || isNaN(amount) || amount === 0) {
        return '₹0';
    }

    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} Lac`;
    } else {
        return `₹${amount.toLocaleString('en-IN')}`;
    }
};

function PieChartVisual({ principalPercent, interestPercent, totalAmount }) {
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const principalDash = (principalPercent / 100) * circumference;
    const interestDash = (interestPercent / 100) * circumference;

    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg className="transform -rotate-90" width="144" height="144" viewBox="0 0 144 144">
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="22"
                />
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    style={{ stroke: 'var(--secondary)' }}
                    strokeWidth="22"
                    strokeDasharray={`${principalDash} ${circumference}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    style={{ stroke: 'var(--primary)' }}
                    strokeWidth="22"
                    strokeDasharray={`${interestDash} ${circumference}`}
                    strokeDashoffset={-principalDash}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xs font-bold text-gray-900">
                    {totalAmount ? formatCurrency(totalAmount) : '-'}
                </p>
            </div>
        </div>
    );
}

export default function EMICalculatorV2({
    defaultPrice = 5000000,
    minPrice = 1000000,
    maxPrice = 50000000,
    showPriceSlider = false,
    propertyTitle = null,
    embedded = false
}) {
    const [propertyPrice, setPropertyPrice] = useState(defaultPrice);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(8.5);
    const [tenureYears, setTenureYears] = useState(20);

    // Update propertyPrice when defaultPrice changes
    useEffect(() => {
        if (defaultPrice && !isNaN(defaultPrice)) {
            queueMicrotask(() => {
                setPropertyPrice(defaultPrice);
            });
        }
    }, [defaultPrice]);

    const emiResult = useMemo(() => {
        if (!propertyPrice || isNaN(propertyPrice) || propertyPrice <= 0) {
            return null;
        }

        const downPaymentAmount = (propertyPrice * downPaymentPercent) / 100;
        const principal = propertyPrice - downPaymentAmount;
        const monthlyRate = interestRate / 12 / 100;
        const tenureMonths = tenureYears * 12;

        if (principal <= 0 || tenureMonths <= 0 || isNaN(principal) || isNaN(tenureMonths)) {
            return null;
        }

        let emi;
        if (monthlyRate === 0) {
            emi = principal / tenureMonths;
        } else {
            emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
                  (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        }

        const totalAmount = emi * tenureMonths;
        const totalInterest = totalAmount - principal;

        if (isNaN(emi) || isNaN(totalAmount) || isNaN(totalInterest)) {
            return null;
        }

        return {
            monthlyEMI: emi,
            principal: principal,
            totalInterest: totalInterest,
            totalAmount: totalAmount,
            downPayment: downPaymentAmount,
            principalPercent: (principal / totalAmount) * 100,
            interestPercent: (totalInterest / totalAmount) * 100
        };
    }, [propertyPrice, downPaymentPercent, interestRate, tenureYears]);

    return (
        <div className={`${embedded ? '' : 'bg-surface'} rounded-2xl ${embedded ? '' : 'shadow-xl'} overflow-hidden`}>
            {/* Header */}
            {!embedded && (
                <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-8 text-btn-text">
                    <div className="flex items-center gap-3 mb-2">
                        <Calculator className="w-8 h-8" />
                        <h2 className="text-3xl font-bold">EMI Calculator</h2>
                    </div>
                    <p className="text-white/90">Calculate your home loan EMI with detailed breakdown</p>
                </div>
            )}

            {propertyTitle && embedded && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Calculate EMI</h3>
                    <p className="text-sm text-gray-600">For {propertyTitle}</p>
                </div>
            )}

            <div className={`${embedded ? '' : 'p-4 md:p-6'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        {/* Property Price */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Property Price
                                </label>
                                <div className="relative w-40">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">₹</span>
                                    <input
                                        type="number"
                                        value={propertyPrice}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 0) {
                                                setPropertyPrice(val);
                                            } else if (e.target.value === '') {
                                                setPropertyPrice(minPrice);
                                            }
                                        }}
                                        min={minPrice}
                                        max={maxPrice}
                                        className="w-full text-black pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm font-semibold focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    step={100000}
                                    value={propertyPrice}
                                    onChange={(e) => setPropertyPrice(parseFloat(e.target.value))}
                                    className="w-full slider-modern"
                                    style={{
                                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((propertyPrice - minPrice) / (maxPrice - minPrice)) * 100}%, #e5e7eb ${((propertyPrice - minPrice) / (maxPrice - minPrice)) * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>{formatCurrency(minPrice)}</span>
                                <span className="font-semibold text-primary">{formatCurrency(propertyPrice)}</span>
                                <span>{formatCurrency(maxPrice)}</span>
                            </div>
                        </div>

                        {/* Down Payment */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Down Payment
                                </label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={downPaymentPercent}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 0 && val <= 50) {
                                                setDownPaymentPercent(val);
                                            } else if (e.target.value === '') {
                                                setDownPaymentPercent(0);
                                            }
                                        }}
                                        min={0}
                                        max={50}
                                        step={0.5}
                                        className="w-full text-black px-2 py-1.5 border border-gray-300 rounded text-sm font-semibold focus:border-primary focus:outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">%</span>
                                </div>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    step={0.5}
                                    value={downPaymentPercent}
                                    onChange={(e) => setDownPaymentPercent(parseFloat(e.target.value))}
                                    className="w-full slider-modern"
                                    style={{
                                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(downPaymentPercent / 50) * 100}%, #e5e7eb ${(downPaymentPercent / 50) * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>0%</span>
                                <span className="font-semibold text-primary">{formatCurrency((propertyPrice * downPaymentPercent) / 100)}</span>
                                <span>50%</span>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Interest Rate
                                </label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={interestRate}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 6.5 && val <= 15) {
                                                setInterestRate(val);
                                            } else if (e.target.value === '') {
                                                setInterestRate(6.5);
                                            }
                                        }}
                                        min={6.5}
                                        max={15}
                                        step={0.1}
                                        className="w-full text-black px-2 py-1.5 border border-gray-300 rounded text-sm font-semibold focus:border-primary focus:outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">%</span>
                                </div>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min={6.5}
                                    max={15}
                                    step={0.1}
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                                    className="w-full slider-modern"
                                    style={{
                                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((interestRate - 6.5) / (15 - 6.5)) * 100}%, #e5e7eb ${((interestRate - 6.5) / (15 - 6.5)) * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>6.5%</span>
                                <span className="font-semibold text-primary">{interestRate}% p.a.</span>
                                <span>15%</span>
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Loan Tenure
                                </label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={tenureYears}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 1 && val <= 30) {
                                                setTenureYears(val);
                                            } else if (e.target.value === '') {
                                                setTenureYears(1);
                                            }
                                        }}
                                        min={1}
                                        max={30}
                                        step={1}
                                        className="w-full px-2 text-black py-1.5 border border-gray-300 rounded text-sm font-semibold focus:border-primary focus:outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">Yrs</span>
                                </div>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min={1}
                                    max={30}
                                    step={1}
                                    value={tenureYears}
                                    onChange={(e) => setTenureYears(parseFloat(e.target.value))}
                                    className="w-full slider-modern"
                                    style={{
                                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((tenureYears - 1) / (30 - 1)) * 100}%, #e5e7eb ${((tenureYears - 1) / (30 - 1)) * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>1 Yr</span>
                                <span className="font-semibold text-primary">{tenureYears} Years</span>
                                <span>30 Yrs</span>
                            </div>
                        </div>

                        {/* Loan Amount Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-primary-soft rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Loan Amount</span>
                                <span className="text-base font-bold text-gray-900">
                                    {emiResult ? formatCurrency(emiResult.principal) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-4">
                        {/* Monthly EMI - Primary Result */}
                        <div className="bg-gradient-to-br from-primary to-primary-light rounded-xl p-4 text-btn-text shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <p className="text-xs font-medium opacity-90">Monthly EMI</p>
                            </div>
                            <p className="text-3xl font-bold">
                                {emiResult ? formatCurrency(emiResult.monthlyEMI) : '-'}
                            </p>
                            <p className="text-xs opacity-75 mt-1">
                                for {tenureYears} years @ {interestRate}% p.a.
                            </p>
                        </div>

                        {/* Breakdown Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-secondary/5 rounded-lg p-3 border-2 border-secondary/20">
                                <p className="text-xs text-secondary/70 font-medium mb-1">Principal</p>
                                <p className="text-base font-bold text-secondary">
                                    {emiResult ? formatCurrency(emiResult.principal) : '-'}
                                </p>
                            </div>

                            <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
                                <p className="text-xs text-red-700 font-medium mb-1">Total Interest</p>
                                <p className="text-base font-bold text-red-900">
                                    {emiResult ? formatCurrency(emiResult.totalInterest) : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border-2 border-gray-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-semibold text-gray-700">Total Payable</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">
                                    {emiResult ? formatCurrency(emiResult.totalAmount) : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <PieChart className="w-4 h-4 text-gray-700" />
                                <h3 className="text-sm font-semibold text-gray-900">Payment Breakdown</h3>
                            </div>

                            {emiResult && (
                                <>
                                    <PieChartVisual
                                        principalPercent={emiResult.principalPercent}
                                        interestPercent={emiResult.interestPercent}
                                        totalAmount={emiResult.totalAmount}
                                    />

                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                                                <span className="text-xs text-gray-700">Principal</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900">
                                                {emiResult.principalPercent.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                                <span className="text-xs text-gray-700">Interest</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900">
                                                {emiResult.interestPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Summary Box */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Note:</strong> This is approximate. Actual EMI may vary based on
                                fees and lender policies.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* Slider container */
                .slider-container {
                    position: relative;
                    width: 100%;
                }

                /* Modern slider styling */
                .slider-modern {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    outline: none;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                /* Webkit (Chrome, Safari, Edge) - Thumb */
                .slider-modern::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(215, 36, 42, 0.3);
                    transition: all 0.2s ease;
                    margin-top: -6px;
                    margin-bottom: -6px;
                }

                .slider-modern::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(215, 36, 42, 0.4);
                }

                .slider-modern::-webkit-slider-thumb:active {
                    transform: scale(1.15);
                }

                /* Webkit - Track */
                .slider-modern::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: transparent;
                }

                /* Firefox - Thumb */
                .slider-modern::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(215, 36, 42, 0.3);
                    transition: all 0.2s ease;
                    position: relative;
                }

                .slider-modern::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(215, 36, 42, 0.4);
                }

                .slider-modern::-moz-range-thumb:active {
                    transform: scale(1.15);
                }

                /* Firefox - Track */
                .slider-modern::-moz-range-track {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: transparent;
                }

                /* Firefox - Progress (filled portion) */
                .slider-modern::-moz-range-progress {
                    height: 8px;
                    border-radius: 4px;
                    background: var(--primary);
                }
            `}</style>
        </div>
    );
}
