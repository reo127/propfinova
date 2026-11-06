'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

// Theme tokens, so this page follows Settings > Theme & Colours like the rest.
const CREAM = 'var(--background)';
const SAND = 'var(--border)';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&h=1600&fit=crop&crop=center';

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  hint,
  reveal,
  onToggleReveal,
}) {
  const isPassword = typeof reveal === 'boolean';

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          style={{ borderColor: SAND }}
          className={`w-full rounded-xl border bg-surface px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 ${
            isPassword ? 'pr-12' : ''
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleReveal}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
          >
            {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AuthError({ children }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
      <span>{children}</span>
    </div>
  );
}

export function AuthSubmit({ loading, loadingLabel, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-primary px-4 py-4 text-[15px] font-bold text-btn-text shadow-[0_10px_30px_-12px_var(--primary)] transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

/**
 * Shared frame for sign in and create account. Both pages render through this,
 * so the two can't drift into looking like different products again.
 *
 * The brand panel shows whatever hero photo the admin has set in Settings, so
 * the sign-in screen carries real property imagery instead of a flat colour.
 */
export default function AuthLayout({ title, subtitle, children, altPrompt, altLabel, altHref }) {
  const [photo, setPhoto] = useState(FALLBACK_PHOTO);

  useEffect(() => {
    let active = true;
    fetch('/api/hero-image')
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.success && d.data?.image) setPhoto(d.data.image);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`min-h-screen lg:grid lg:grid-cols-[minmax(0,47%)_minmax(0,53%)]`}
      style={{ backgroundColor: CREAM }}
    >
      {/* Brand panel — property photograph under an ink scrim */}
      <aside className="relative isolate flex min-h-[220px] flex-col justify-between overflow-hidden bg-secondary px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${photo})` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            // Light enough up top that the building still reads, dark at the
            // bottom so the tagline keeps its contrast.
            background:
              'linear-gradient(180deg, rgba(11,15,25,0.38) 0%, rgba(11,15,25,0.28) 34%, rgba(11,15,25,0.86) 78%, rgba(11,15,25,0.95) 100%)',
          }}
        />

        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-xl px-3 py-2 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(247,244,236,0.94)' }}
        >
          <Image
            src="/propfinova-logo.png"
            alt="PropFinova"
            width={132}
            height={46}
            className="h-auto w-[104px] object-contain sm:w-[128px]"
            priority
          />
        </Link>

        <div className="hidden lg:block">
          <span className="mb-6 block h-px w-14 bg-primary" />
          <p
            className="max-w-md text-[40px] leading-[1.1] text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Find your space.
            <span className="block">Unlock your possibilities.</span>
          </p>
          <p className="mt-6 text-sm text-white/65">
            Verified listings, direct builder deals, no brokerage layered on top.
          </p>
        </div>

        <p className="hidden text-xs text-white/40 lg:block">© {new Date().getFullYear()} PropFinova</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:py-12">
        <div className="w-full max-w-[27rem]">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>

          <div
            className="rounded-[26px] border bg-surface p-7 shadow-[0_24px_60px_-32px_rgba(11,15,25,0.45)] sm:p-9"
            style={{ borderColor: SAND }}
          >
            <h1
              className="text-[34px] leading-[1.15] text-slate-900 sm:text-[38px]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {title}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">{subtitle}</p>

            <div className="mt-7">{children}</div>

            <p
              className="mt-7 border-t pt-6 text-sm text-slate-600"
              style={{ borderColor: SAND }}
            >
              {altPrompt}{' '}
              <Link
                href={altHref}
                className="rounded font-semibold text-slate-900 underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {altLabel}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
