'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, Search as SearchIcon, Loader2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';
import WishlistButton from '../components/WishlistButton';

/**
 * The saved-properties page. The heart on a listing card had nowhere to lead
 * before this — the only list lived inside the /user dashboard, which has no
 * nav entry.
 */
export default function WishlistPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | signedOut

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      queueMicrotask(() => setStatus('signedOut'));
      return;
    }

    let active = true;
    fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setProperties(d?.success ? d.data : []);
        setStatus('ready');
      })
      .catch(() => active && setStatus('ready'));

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="flex items-center gap-2 text-2xl text-secondary sm:text-3xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Heart className="h-6 w-6 text-primary" />
              Saved properties
            </h1>
            <p className="mt-1 text-sm text-secondary/55">
              {status === 'ready'
                ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} saved`
                : 'Your shortlist, in one place'}
            </p>
          </div>

          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <SearchIcon className="h-4 w-4" />
            Browse more
          </Link>
        </div>

        {status === 'loading' && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}

        {status === 'signedOut' && (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <Heart className="mx-auto mb-3 h-9 w-9 text-secondary/25" />
            <h2 className="text-lg font-semibold text-secondary">Sign in to see your shortlist</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-secondary/55">
              Saved properties are tied to your account so you can pick up where you left off on any device.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => router.push('/login')}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-btn-text transition-colors hover:bg-primary-dark cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/register')}
                className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && properties.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <Heart className="mx-auto mb-3 h-9 w-9 text-secondary/25" />
            <h2 className="text-lg font-semibold text-secondary">Nothing saved yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-secondary/55">
              Tap the heart on any listing and it will appear here for easy comparison later.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-btn-text transition-colors hover:bg-primary-dark"
            >
              Browse properties
            </Link>
          </div>
        )}

        {status === 'ready' && properties.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property._id}
                className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:border-primary/35 hover:shadow-lg"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  <Link href={generatePropertyUrl(property)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                  <WishlistButton
                    propertyId={property._id}
                    className="absolute top-3 right-3"
                    onRemoved={() =>
                      setProperties((prev) => prev.filter((p) => p._id !== property._id))
                    }
                  />
                </div>

                <Link href={generatePropertyUrl(property)} className="block p-5">
                  <h3 className="line-clamp-1 text-base font-semibold text-secondary">{property.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-secondary/55">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                  </p>
                  <p className="mt-3 text-lg font-semibold tabular-nums text-secondary">
                    {property.price ? formatPrice(property.price) : 'Price on request'}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
