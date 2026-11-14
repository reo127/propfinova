'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

// Fired by every WishlistButton instance after a successful toggle, so any
// other instance of the same property (e.g. a card and the detail page open
// in two tabs) can stay in sync without a shared store.
const WISHLIST_EVENT = 'propfinova:wishlist-changed';

export default function WishlistButton({ propertyId, className = '', onRemoved }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) {
          setSaved(d.data.some((p) => p._id === propertyId));
        }
      })
      .catch(() => {});

    const onChange = (e) => {
      if (e.detail?.propertyId === propertyId) setSaved(e.detail.saved);
    };
    window.addEventListener(WISHLIST_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(WISHLIST_EVENT, onChange);
    };
  }, [propertyId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    const next = !saved;
    setSaved(next);

    try {
      await fetch(next ? '/api/wishlist' : `/api/wishlist/${propertyId}`, {
        method: next ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: next ? JSON.stringify({ propertyId }) : undefined,
      });
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { propertyId, saved: next } }));
      if (!next) onRemoved?.();
    } catch {
      setSaved(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={saved}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-105 cursor-pointer ${className}`}
    >
      <Heart size={17} className={saved ? 'text-primary' : 'text-secondary/60'} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
