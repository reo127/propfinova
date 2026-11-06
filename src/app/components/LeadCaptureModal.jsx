'use client';

import { useState } from 'react';
import { getAllLocations } from '@/utils/locations';

export default function LeadCaptureModal({ isOpen, onClose, onSubmit, title = "Get Exclusive Property Access", description = "Join 5,000+ happy families who found their dream home with us.", propertyLocation = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interestedLocation: propertyLocation
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.name.trim() || !formData.phone.trim() || (!propertyLocation && !formData.interestedLocation.trim())) {
        throw new Error(propertyLocation ? 'Name and phone are required' : 'Name, phone, and interested location are required');
      }

      if (formData.phone.replace(/\s/g, '').length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      await onSubmit(formData);
      setFormData({ name: '', phone: '', email: '', interestedLocation: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      {/* Background overlay with blur */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal panel */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl animate-in fade-in zoom-in duration-300 md:flex-row">
          
          {/* Left Side: Visual & Benefits (Hidden on Mobile) */}
          <div className="relative hidden overflow-hidden bg-primary p-6 text-btn-text md:flex md:w-2/5 md:flex-col md:justify-between">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-32 h-32 bg-white/5 rounded-full"></div>
            
            <div className="relative">
              <div className="mb-5 h-1 w-12 rounded-full bg-surface"></div>
              <h3 className="text-2xl font-extrabold leading-tight">
                Unlock <br />
                <span className="text-white/80">Premium</span> <br />
                Listings
              </h3>
              <p className="mt-3 text-sm text-white/90">
                Get first-hand access to new launches and exclusive builder offers before they hit the market.
              </p>
            </div>

            <div className="relative mt-6 space-y-3">
              {[
                "Zero Brokerage on New Projects",
                "Verified Direct Builder Floor Plans",
                "Priority Site Visit Scheduling",
                "Exclusive Launch Discounts"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            <div className="relative mt-auto border-t border-white/20 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-white/80">Trusted by 5,000+ families</span>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="relative flex-1 overflow-y-auto p-5 sm:p-7">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6 pr-10">
              <h3 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{title}</h3>
              <p className="text-gray-500 mt-2 text-sm">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="bg-red-50 border-l-4 border-primary text-primary p-3 rounded text-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 px-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 px-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-12 pr-4 text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Hide location when already known from property page */}
              {!propertyLocation && (
                <div>
                  <label htmlFor="interestedLocation" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 px-1">
                    Preferred Location
                  </label>
                  <select
                    id="interestedLocation"
                    name="interestedLocation"
                    value={formData.interestedLocation}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 bg-surface px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">Select where you want to buy</option>
                    {getAllLocations().map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Hide email on property pages to reduce friction */}
              {!propertyLocation && (
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 px-1">
                    Email Address <span className="text-gray-400 font-normal italic">(For floor plans)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                    placeholder="john@example.com"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-btn-text shadow-xl shadow-red-600/20 transition-all hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      Get Free Consultation
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:flex-row">
                <div className="flex items-center gap-2 text-primary text-xs font-bold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  100% Privacy Guaranteed
                </div>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-xs font-medium underline underline-offset-4"
                >
                  Close & browse properties
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
}
