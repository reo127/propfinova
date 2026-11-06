import React from 'react'
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, ShieldCheck } from 'lucide-react';
import Logo from '../../../public/propfinova-logo.png'

// Column links kept as data so the three groups stay on one visual rhythm.
const LINK_GROUPS = [
    {
        title: 'Company',
        links: [
            { href: '/about', label: 'About' },
            { href: '/careers', label: 'Careers' },
            { href: '/contact', label: 'Contact' },
            { href: '/blog', label: 'Blog' },
        ],
    },
    {
        title: 'Explore',
        links: [
            { href: '/search?tab=new', label: 'New Projects' },
            { href: '/search?tab=buy', label: 'Buy' },
            { href: '/search?tab=rent', label: 'Rent' },
            { href: '/calculators', label: 'EMI Calculator' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { href: '/terms', label: 'Terms & Conditions' },
            { href: '/privacy', label: 'Privacy Policy' },
        ],
    },
];

const Footer = () => {
    return (
        <footer className="border-t border-border bg-surface text-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Brand + link columns */}
                <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="max-w-xs">
                        <Image
                            src={Logo}
                            alt="PropFinova logo"
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-xl object-contain"
                        />
                        <p className="mt-4 text-sm leading-relaxed text-muted">
                            New projects, verified listings, and trusted agents across India.
                        </p>
                        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Built on Trust
                        </p>
                    </div>

                    {LINK_GROUPS.map(({ title, links }) => (
                        <nav key={title} aria-label={title}>
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondary">
                                {title}
                            </h2>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                {links.map(({ href, label }) => (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className="text-muted transition-colors hover:text-primary"
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                {/* Contact block. The TBD values are placeholders for the owner
                    to fill in from Settings > General, not invented data. */}
                <div className="grid gap-8 border-t border-border py-10 md:grid-cols-3">
                    <div>
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondary">
                            Corporate Office
                        </h2>
                        <p className="mt-4 flex gap-2.5 text-sm leading-relaxed text-muted">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>
                                TBD Address Line 1,<br />
                                TBD Address Line 2,<br />
                                TBD City, TBD Pincode
                            </span>
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondary">
                            Reach Out To Us
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <a
                                href="tel:+910000000000"
                                className="group flex flex-col rounded-2xl border border-border bg-background p-4 text-left transition-all duration-200 hover:border-primary hover:bg-surface hover:shadow-sm"
                            >
                                <span className="text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                                    TBD Name
                                </span>
                                <span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    TBD Title
                                </span>
                                <span className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
                                    <Phone className="h-3.5 w-3.5" />
                                    TBD Phone
                                </span>
                                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                    <MapPin className="h-3.5 w-3.5" />
                                    TBD City
                                </span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Legal strip */}
                <div className="flex flex-col items-start gap-4 border-t border-border py-6 text-xs md:flex-row md:items-center md:justify-between">
                    <p className="text-muted">
                        © {new Date().getFullYear()} PropFinova Pvt Ltd. All rights reserved. · Developed by{' '}
                        <a
                            href="https://digistrivemedia.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-secondary transition-colors hover:text-primary"
                        >
                            DigistriveMedia
                        </a>
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-5">
                        {[
                            { label: 'GST', value: 'TBD' },
                            { label: 'RERA', value: 'TBD' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="font-semibold text-secondary">{label}:</span>
                                <span className="rounded bg-background px-2 py-0.5 font-medium text-muted">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
