/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";

const allProperties = [
    {
        id: 1,
        title: "Modern Downtown Apartment",
        location: "Downtown, Metropolis",
        price: "1,200,000",
        type: "flat",
        bhk: "2bhk",
        mode: "buy",
        img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Spacious Family House",
        location: "Suburbia, Metropolis",
        price: "750,000",
        type: "house",
        bhk: "3bhk",
        mode: "buy",
        img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Luxury Villa with Pool",
        location: "Hillside, Metropolis",
        price: "3,500,000",
        type: "house",
        bhk: "5bhk",
        mode: "buy",
        img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: 4,
        title: "Commercial Office Space",
        location: "Business District, Metropolis",
        price: "5,000/month",
        type: "office",
        bhk: "na",
        mode: "rent",
        img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: 5,
        title: "Vast Stretch of Land",
        location: "Countryside, Metropolis",
        price: "500,000",
        type: "land",
        bhk: "na",
        mode: "sell",
        img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: 6,
        title: "Cozy 1BHK for Rent",
        location: "Uptown, Metropolis",
        price: "1,500/month",
        type: "flat",
        bhk: "1bhk",
        mode: "rent",
        img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format&fit=crop",
    },
];

export default function PropertyList() {
    const [properties, setProperties] = useState(allProperties);
    const [filters, setFilters] = useState({
        location: "",
        mode: "",
        price: "",
        type: "",
        bhk: "",
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    };

    const applyFilters = () => {
        let filtered = allProperties;

        if (filters.location) {
            filtered = filtered.filter((p) =>
                p.location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }
        if (filters.mode) {
            filtered = filtered.filter((p) => p.mode === filters.mode);
        }
        if (filters.type) {
            filtered = filtered.filter((p) => p.type === filters.type);
        }
        if (filters.bhk) {
            filtered = filtered.filter((p) => p.bhk === filters.bhk);
        }
        // Simple price filter (can be expanded)
        if (filters.price) {
            const maxPrice = parseInt(filters.price, 10);
            filtered = filtered.filter(
                (p) => parseInt(p.price.replace(/[^0-9]/g, ""), 10) <= maxPrice
            );
        }

        setProperties(filtered);
    };

    return (
        <div className="bg-surface text-gray-900">
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter Bar */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            name="location"
                            placeholder="Search by location..."
                            value={filters.location}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-md"
                        />
                        <select
                            name="mode"
                            value={filters.mode}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-md bg-surface"
                        >
                            <option value="">Buy/Sell/Rent</option>
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                            <option value="rent">Rent</option>
                        </select>
                        <select
                            name="price"
                            value={filters.price}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-md bg-surface"
                        >
                            <option value="">Max Price</option>
                            <option value="100000">100,000</option>
                            <option value="500000">500,000</option>
                            <option value="1000000">1,000,000</option>
                            <option value="5000000">5,000,000</option>
                        </select>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-md bg-surface"
                        >
                            <option value="">Property Type</option>
                            <option value="flat">Flat</option>
                            <option value="house">House</option>
                            <option value="land">Land</option>
                            <option value="office">Office Space</option>
                        </select>
                        <select
                            name="bhk"
                            value={filters.bhk}
                            onChange={handleFilterChange}
                            className="p-2 border rounded-md bg-surface"
                        >
                            <option value="">BHK</option>
                            <option value="1bhk">1 BHK</option>
                            <option value="2bhk">2 BHK</option>
                            <option value="3bhk">3 BHK</option>
                            <option value="4bhk">4 BHK</option>
                            <option value="5bhk">5+ BHK</option>
                        </select>
                    </div>
                    <div className="mt-4 text-right">
                        <button
                            onClick={applyFilters}
                            className="px-6 py-2 rounded-md bg-primary text-white font-medium hover:bg-primary-dark"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Property Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((p) => (
                        <div
                            key={p.id}
                            className="group overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="relative h-56">
                                <img
                                    src={p.img}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold">{p.title}</h3>
                                <p className="text-sm text-gray-600">{p.location}</p>
                                <p className="mt-2 text-xl font-bold text-primary">Price on Request</p>
                                <div className="mt-3 flex items-center justify-start gap-2 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-primary-light text-primary-darker">
                                        {p.type}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                        {p.bhk}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                        For {p.mode}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
