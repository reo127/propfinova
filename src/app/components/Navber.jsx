'use client';

import React, { useEffect, useState } from 'react'
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search as SearchIcon, Building2, User as UserIcon } from 'lucide-react';
import Logo from '../../../public/propfinova-logo.png'

const Navber = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isSearchActive = pathname === '/search';
    const navLinkClass = (active) =>
        `text-sm font-medium transition-colors duration-200 relative group rounded-sm ${active ? 'text-primary' : 'text-secondary/70 hover:text-secondary'}`;
    const navUnderlineClass = (active) =>
        `absolute -bottom-2 left-0 h-0.5 rounded-full bg-primary transition-all duration-200 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`;
    // min-h-11 keeps every mobile row at the 44px touch target.
    const mobileLinkClass = (active) =>
        `flex min-h-11 items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 group ${active ? 'bg-primary/10 text-primary' : 'text-secondary/75 hover:bg-primary/5 hover:text-secondary'}`;

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            queueMicrotask(() => {
                setUser(JSON.parse(storedUser));
            });
        }
    }, []);

    // Escape closes the drawer, and the page behind it must not scroll while
    // it is open. Both run off the same state so they cannot disagree.
    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') setIsMobileMenuOpen(false);
        };
        const previousOverflow = document.body.style.overflow;

        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    // Hide navbar on login, register, and admin pages
    if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/70 supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main navbar */}
                <div className="flex items-center justify-between py-3">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <div className="flex items-center">
                            <Image
                                src={Logo}
                                alt="PropFinova Logo"
                                className="h-11 w-auto rounded-md"
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {[
                            { href: '/search?tab=buy', label: 'Buy' },
                            { href: '/search?tab=new', label: 'New Projects' },
                            { href: '/about', label: 'About' },
                            { href: '/blog', label: 'Blog' },
                        ].map(({ href, label }) => {
                            const active = href.startsWith('/search') ? isSearchActive : pathname === href;
                            return (
                                <Link key={href} href={href} className={navLinkClass(active)}>
                                    {label}
                                    <span className={navUnderlineClass(active)}></span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile: search + menu buttons */}
                    <div className="flex items-center gap-1 lg:hidden">
                        <Link
                            href="/search"
                            aria-label="Search properties"
                            className="flex items-center justify-center w-10 h-10 rounded-full text-secondary/70 hover:bg-secondary/5 hover:text-primary transition-colors"
                        >
                            <SearchIcon className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-secondary/5 cursor-pointer"
                        >
                            <span className="sr-only">{isMobileMenuOpen ? 'Close' : 'Open'} main menu</span>
                            {!isMobileMenuOpen ? (
                                <Menu className="w-6 h-6" />
                            ) : (
                                <X className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Right side actions */}
                    <div className="hidden lg:flex items-center space-x-3">
                        <Link
                            href="/search"
                            aria-label="Search properties"
                            className="flex items-center justify-center w-10 h-10 rounded-full text-secondary/70 hover:bg-secondary/5 hover:text-primary transition-colors"
                        >
                            <SearchIcon className="w-5 h-5" />
                        </Link>
                        {user ? (
                            <>
                                {user.role === 'agent' && (
                                    <Link
                                        href="/agent/my-leads"
                                        className="px-4 py-2 text-xs font-semibold text-secondary/75 rounded-lg hover:bg-secondary/5 transition-all duration-200 border border-border"
                                    >
                                        My CRM
                                    </Link>
                                )}
                                <div className="flex items-center space-x-3 pl-2">
                                    <div className="hidden sm:flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-primary text-sm font-semibold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-secondary/70 text-sm font-medium hidden lg:inline">
                                            {user.email.split('@')[0]}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-semibold bg-primary text-btn-text rounded-lg hover:bg-primary-dark transition-all duration-200 cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Link
                                    href="/login"
                                    className="flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-secondary/75 transition-all duration-200 hover:bg-secondary/5 hover:text-secondary"
                                >
                                    Sign In
                                </Link>

                                <Link
                                    href="/register"
                                    className="flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-btn-text shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile menu overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="lg:hidden fixed inset-0 z-50 bg-secondary/40 backdrop-blur-sm transition-all duration-300 ease-in-out"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile menu */}
                <div
                    id="mobile-menu"
                    aria-hidden={!isMobileMenuOpen}
                    /* `invisible` when closed so the off-screen links leave the
                       tab order — aria-hidden alone would still let keyboard
                       users focus them. */
                    className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl transform transition-[transform,visibility] duration-300 ease-in-out z-50 ${isMobileMenuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
                        }`}>
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center">
                                <Image
                                    src={Logo}
                                    alt="PropFinova Logo"
                                    className="h-10 w-auto rounded-md"
                                />
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg text-secondary hover:bg-secondary/5 transition-colors duration-200 cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                            {/* Search All — prominent entry */}
                            <Link
                                href="/search"
                                className={mobileLinkClass(isSearchActive)}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <SearchIcon className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" />
                                Search All Properties
                            </Link>

                            <div className="pt-3 pb-1">
                                <p className="px-4 text-xs font-semibold text-secondary/40">Browse by type</p>
                            </div>

                            <Link
                                href="/search?tab=buy"
                                className={mobileLinkClass(false)}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Building2 className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" />
                                Buy
                            </Link>
                            <Link
                                href="/search?tab=sell"
                                className={mobileLinkClass(false)}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Sell
                            </Link>
                            <Link
                                href="/search?tab=new"
                                className={mobileLinkClass(false)}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                New Projects
                            </Link>

                            <Link
                                href="/about"
                                className={mobileLinkClass(pathname === '/about')}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                About
                            </Link>
                            <Link
                                href="/blog"
                                className={mobileLinkClass(pathname === '/blog')}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Blog
                            </Link>
                        </div>

                        {/* Mobile user actions */}
                        <div className="px-4 py-4 border-t border-border bg-surface/60">
                            {user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center px-4 py-3 bg-primary/5 rounded-xl">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                                            <span className="text-primary text-lg font-bold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-secondary font-medium">
                                                {user.email.split('@')[0]}
                                            </div>
                                            <div className="text-secondary/50 text-sm">
                                                {user.role === 'admin' ? 'Administrator' : 'User'}
                                            </div>
                                        </div>
                                    </div>
                                    {user.role === 'agent' && (
                                        <Link
                                            href="/agent/my-leads"
                                            className="flex items-center px-4 py-3 text-secondary/75 hover:bg-background rounded-xl transition-all duration-200 group"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <svg className="w-5 h-5 mr-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            My CRM
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-all duration-200 cursor-pointer"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center px-4 py-3 text-base font-semibold border border-primary text-primary rounded-xl hover:bg-primary/5 transition-all duration-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <UserIcon className="w-5 h-5 mr-2" />
                                        Sign In
                                    </Link>

                                    <Link
                                        href="/register"
                                        className="flex items-center justify-center px-4 py-3 text-base font-semibold bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-all duration-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navber
