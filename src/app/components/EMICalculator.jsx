"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calculator, TrendingUp, PieChart, DollarSign } from 'lucide-react';

const formatCurrency = (amount) => {
    // Handle invalid values
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
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const principalDash = (principalPercent / 100) * circumference;
    const interestDash = (interestPercent / 100) * circumference;

    return (
        <div className="relative w-48 h-48 mx-auto">
            <svg className="transform -rotate-90" width="192" height="192" viewBox="0 0 192 192">
                {/* Background circle */}
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="28"
                />

                {/* Principal arc */}
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    style={{ stroke: 'var(--secondary)' }}
                    strokeWidth="28"
                    strokeDasharray={`${principalDash} ${circumference}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />

                {/* Interest arc */}
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    style={{ stroke: 'var(--primary)' }}
                    strokeWidth="28"
                    strokeDasharray={`${interestDash} ${circumference}`}
                    strokeDashoffset={-principalDash}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-sm font-bold text-gray-900">
                    {totalAmount ? formatCurrency(totalAmount) : '-'}
                </p>
            </div>
        </div>
    );
}

function CustomSlider({ value, onChange, min, max, step = 1, formatValue }) {
    // Ensure valid values
    const safeValue = !isNaN(value) && value !== null && value !== undefined ? value : min;
    const safeMin = !isNaN(min) && min !== null ? min : 0;
    const safeMax = !isNaN(max) && max !== null ? max : 100;
    const safeStep = !isNaN(step) && step > 0 ? step : 1;

    const percentage = safeMax > safeMin ? ((safeValue - safeMin) / (safeMax - safeMin)) * 100 : 0;
    const safePercentage = !isNaN(percentage) && isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Use refs to store values that shouldn't trigger re-renders
    const minRef = useRef(safeMin);
    const maxRef = useRef(safeMax);
    const stepRef = useRef(safeStep);
    const onChangeRef = useRef(onChange);

    // Update refs when values change
    useEffect(() => {
        minRef.current = safeMin;
        maxRef.current = safeMax;
        stepRef.current = safeStep;
        onChangeRef.current = onChange;
    }, [safeMin, safeMax, safeStep, onChange]);

    const handleSliderChange = useCallback((clientX, rect) => {
        if (!rect || rect.width === 0) return;

        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const percentage = x / rect.width;
        const rawValue = minRef.current + percentage * (maxRef.current - minRef.current);
        const steppedValue = Math.round(rawValue / stepRef.current) * stepRef.current;
        const clampedValue = Math.max(minRef.current, Math.min(maxRef.current, steppedValue));

        // Round to appropriate decimal places based on step
        const decimalPlaces = stepRef.current < 1 ? Math.abs(Math.floor(Math.log10(stepRef.current))) : 0;
        const roundedValue = parseFloat(clampedValue.toFixed(decimalPlaces));

        if (!isNaN(roundedValue) && isFinite(roundedValue)) {
            onChangeRef.current(roundedValue);
        }
    }, []); // No dependencies - uses refs instead

    const handleMouseMove = useCallback((e) => {
        if (sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect();
            handleSliderChange(e.clientX, rect);
        }
    }, [handleSliderChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect();
            handleSliderChange(e.touches[0].clientX, rect);
        }
    }, [handleSliderChange]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        handleSliderChange(e.clientX, rect);
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        handleSliderChange(e.touches[0].clientX, rect);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
        <div className="relative pt-2">
            {/* Slider track */}
            <div
                ref={sliderRef}
                className={`relative h-2 bg-gray-200 rounded-full ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Progress bar */}
                <div
                    className="absolute h-2 bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-200"
                    style={{ width: `${safePercentage}%` }}
                />

                {/* Draggable thumb */}
                <div
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-surface border-3 border-primary rounded-full shadow-lg transition-all duration-200 pointer-events-none ${
                        isDragging ? 'scale-110' : ''
                    }`}
                    style={{ left: `calc(${safePercentage}% - 10px)` }}
                />
            </div>

            {/* Value labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatValue ? formatValue(safeMin) : safeMin}</span>
                <span>{formatValue ? formatValue(safeMax) : safeMax}</span>
            </div>
        </div>
    );
}

export default function EMICalculator({
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
        // Validate inputs
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

        // Validate calculated values
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

            <div className={`${embedded ? '' : 'p-6 md:p-8'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        {/* Property Price */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-black">
                            <label className="block text-sm font-semibold text-gray-700 mb-3 ">
                                Property Price
                            </label>
                            <div className="mb-3">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
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
                                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-base font-semibold transition-colors"
                                        placeholder={`₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{formatCurrency(propertyPrice)}</p>
                            </div>
                            {showPriceSlider && (
                                <CustomSlider
                                    value={propertyPrice}
                                    onChange={setPropertyPrice}
                                    min={minPrice}
                                    max={maxPrice}
                                    step={100000}
                                    formatValue={formatCurrency}
                                />
                            )}
                        </div>

                        {/* Down Payment */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Down Payment (%)
                                </label>
                                <span className="text-sm font-bold text-primary">
                                    {formatCurrency((propertyPrice * downPaymentPercent) / 100)}
                                </span>
                            </div>
                            <div className="mb-3">
                                <div className="relative">
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
                                        step={1}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-base font-semibold transition-colors"
                                        placeholder="0-50%"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                </div>
                            </div>
                            <CustomSlider
                                value={downPaymentPercent}
                                onChange={setDownPaymentPercent}
                                min={0}
                                max={50}
                                step={1}
                                formatValue={(val) => `${val}%`}
                            />
                        </div>

                        {/* Interest Rate */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Interest Rate (% per annum)
                            </label>
                            <div className="mb-3">
                                <div className="relative">
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
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-base font-semibold transition-colors"
                                        placeholder="6.5-15%"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                </div>
                            </div>
                            <CustomSlider
                                value={interestRate}
                                onChange={setInterestRate}
                                min={6.5}
                                max={15}
                                step={0.1}
                                formatValue={(val) => `${val.toFixed(1)}%`}
                            />
                        </div>

                        {/* Tenure */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Loan Tenure (Years)
                            </label>
                            <div className="mb-3">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={tenureYears}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 1 && val <= 30) {
                                                setTenureYears(val);
                                            } else if (e.target.value === '') {
                                                setTenureYears(5);
                                            }
                                        }}
                                        min={1}
                                        max={30}
                                        step={1}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-base font-semibold transition-colors"
                                        placeholder="1-30 years"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Years</span>
                                </div>
                            </div>
                            <CustomSlider
                                value={tenureYears}
                                onChange={setTenureYears}
                                min={1}
                                max={30}
                                step={1}
                                formatValue={(val) => `${val} Yrs`}
                            />
                        </div>

                        {/* Loan Amount Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-primary-soft rounded-xl p-5 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Loan Amount</span>
                                <span className="text-lg font-bold text-gray-900">
                                    {emiResult ? formatCurrency(emiResult.principal) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {/* Monthly EMI - Primary Result */}
                        <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-6 text-btn-text shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5" />
                                <p className="text-sm font-medium opacity-90">Monthly EMI</p>
                            </div>
                            <p className="text-4xl font-bold">
                                {emiResult ? formatCurrency(emiResult.monthlyEMI) : '-'}
                            </p>
                            <p className="text-xs opacity-75 mt-2">
                                for {tenureYears} years @ {interestRate}% p.a.
                            </p>
                        </div>

                        {/* Breakdown Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/5 rounded-xl p-4 border-2 border-secondary/20">
                                <p className="text-xs text-secondary/70 font-medium mb-1">Principal Amount</p>
                                <p className="text-lg font-bold text-secondary">
                                    {emiResult ? formatCurrency(emiResult.principal) : '-'}
                                </p>
                            </div>

                            <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                                <p className="text-xs text-red-700 font-medium mb-1">Total Interest</p>
                                <p className="text-lg font-bold text-red-900">
                                    {emiResult ? formatCurrency(emiResult.totalInterest) : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">Total Amount Payable</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {emiResult ? formatCurrency(emiResult.totalAmount) : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Payment Breakdown</h3>
                            </div>

                            {emiResult && (
                                <>
                                    <PieChartVisual
                                        principalPercent={emiResult.principalPercent}
                                        interestPercent={emiResult.interestPercent}
                                        totalAmount={emiResult.totalAmount}
                                    />

                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-secondary rounded-full"></div>
                                                <span className="text-sm text-gray-700">Principal</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {emiResult.principalPercent.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-primary rounded-full"></div>
                                                <span className="text-sm text-gray-700">Interest</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {emiResult.interestPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Summary Box */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Note:</strong> This is an approximate EMI calculation. Actual EMI may vary based on
                                processing fees, other charges, and lender policies. Please consult with your bank for
                                accurate details.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
