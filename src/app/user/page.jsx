'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Heart, Landmark, IdCard } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';
import WishlistButton from '../components/WishlistButton';
import { formatMoney } from '@/lib/loanMath';
import { STAGE_MAP } from '@/lib/loanStages';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    queueMicrotask(() => {
      if (!storedUser) {
        router.push('/login');
        return;
      }
      setUser(JSON.parse(storedUser));
      setLoading(false);
    });

    if (token) {
      fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setWishlist(d.data);
        })
        .catch(() => {})
        .finally(() => setLoadingWishlist(false));

      fetch('/api/loan-applications?mine=true', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setApplications(d.data);
        })
        .catch(() => {})
        .finally(() => setLoadingApplications(false));
    } else {
      queueMicrotask(() => { setLoadingWishlist(false); setLoadingApplications(false); });
    }
  }, [router]);

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-secondary mb-2">My Account</h1>
      <p className="text-muted mb-8">Welcome, {user.name}!</p>

      <div className="mb-10">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <Landmark size={20} className="text-primary" />
            <h2 className="text-xl font-semibold text-secondary">My Loan Applications</h2>
          </div>
          <Link href="/user/loan-profile" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <IdCard size={15} />
            My Loan Profile
          </Link>
        </div>

        {loadingApplications ? (
          <p className="text-muted text-sm">Loading your applications...</p>
        ) : applications.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <p className="text-secondary/60 mb-4">You haven&apos;t applied for a loan yet.</p>
            <Link href="/loans" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-btn-text font-semibold hover:bg-primary-dark transition-colors">
              Browse loan offers
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {applications.map((a) => (
              <div key={a._id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-secondary truncate">{a.lenderNameSnapshot} · {a.productNameSnapshot}</p>
                  <p className="text-sm text-muted mt-0.5">{formatMoney(a.loanAmount)} · {a.tenureYears} years</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STAGE_MAP[a.status]?.cls || 'bg-slate-100 text-slate-700'}`}>
                  {STAGE_MAP[a.status]?.label || a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <Heart size={20} className="text-primary" />
        <h2 className="text-xl font-semibold text-secondary">My Wishlist</h2>
      </div>

      {loadingWishlist ? (
        <p className="text-muted text-sm">Loading your saved properties...</p>
      ) : wishlist.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-secondary/60 mb-4">You haven&apos;t saved any properties yet.</p>
          <Link href="/search" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-btn-text font-semibold hover:bg-primary-dark transition-colors">
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((property) => (
            <div key={property._id} className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Link href={generatePropertyUrl(property)}>
                  <img
                    src={property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </Link>
                <WishlistButton
                  propertyId={property._id}
                  className="absolute top-3 right-3"
                  onRemoved={() => setWishlist((prev) => prev.filter((p) => p._id !== property._id))}
                />
              </div>
              <Link href={generatePropertyUrl(property)} className="block p-5">
                <h3 className="text-base font-semibold text-secondary line-clamp-1">{property.title}</h3>
                <p className="mt-1 text-sm text-secondary/55 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{property.location}</span>
                </p>
                <p className="mt-3 text-lg font-semibold text-secondary tabular-nums">
                  {property.price ? formatPrice(property.price) : 'Price on request'}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
