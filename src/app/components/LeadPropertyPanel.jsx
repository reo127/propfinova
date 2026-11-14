'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Search as SearchIcon, Compass, Send, Loader2, Check, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';

/**
 * On-call inventory panel for the lead detail screen.
 *
 * "Nearby" answers the common objection mid-call — the lead wants HSR Layout,
 * this surfaces HSR Layout plus its neighbouring areas so the caller always
 * has stock to offer. "Search" is the free-form lookup for everything else.
 *
 * Sharing a property WhatsApps it to the lead and appends a note to the
 * lead's activity history, so the next caller can see what was already sent.
 */

const TYPE_OPTIONS = [
  { value: '', label: 'Any type' },
  { value: 'apartments', label: 'Apartments' },
  { value: 'villas', label: 'Villas' },
  { value: 'independent-house', label: 'Independent House' },
  { value: 'plots', label: 'Plots' },
  { value: 'commercial-space', label: 'Commercial' },
];

const BHK_OPTIONS = ['', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk'];

const cleanPhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);

export default function LeadPropertyPanel({ lead, onLeadUpdated }) {
  const [tab, setTab] = useState('nearby');

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-xs">
      <div className="flex border-b border-slate-200">
        <TabButton active={tab === 'nearby'} onClick={() => setTab('nearby')} icon={Compass}>
          Nearby Properties
        </TabButton>
        <TabButton active={tab === 'search'} onClick={() => setTab('search')} icon={SearchIcon}>
          Search Properties
        </TabButton>
      </div>

      <div className="p-5 sm:p-6">
        {tab === 'nearby' ? (
          <NearbyTab lead={lead} onLeadUpdated={onLeadUpdated} />
        ) : (
          <SearchTab lead={lead} onLeadUpdated={onLeadUpdated} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-colors cursor-pointer ${
        active
          ? 'border-b-2 border-primary bg-primary/5 text-primary'
          : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function NearbyTab({ lead, onLeadUpdated }) {
  const location = lead?.interestedLocation;

  const [groups, setGroups] = useState([]);
  const [matched, setMatched] = useState(null);
  // Starts false when there is nothing to fetch, so the effect never has to
  // call setState synchronously just to clear a spinner that never spun.
  const [loading, setLoading] = useState(Boolean(location));

  useEffect(() => {
    if (!location) return;

    let active = true;
    fetch(`/api/properties/nearby?location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setGroups(d?.success ? d.groups : []);
        setMatched(d?.matchedLocality || null);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location]);

  if (!location) {
    return <Empty>This lead has no interested location recorded, so there is nothing to match against.</Empty>;
  }

  if (loading) return <Spinner />;

  const total = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-slate-600">
          Looking for <span className="font-bold text-slate-900">{location}</span>
        </span>
        {matched && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            matched {matched}
          </span>
        )}
        <span className="text-slate-400">·</span>
        <span className="font-semibold text-slate-700">{total} available</span>
      </div>

      {groups.length === 0 ? (
        <Empty>
          Nothing listed in {location} or its neighbouring areas yet. Try the Search tab for a wider look.
        </Empty>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.locality}>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{group.locality}</h4>
                {group.isExact ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-btn-text">
                    Exact area
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    Nearby
                  </span>
                )}
                <span className="text-xs text-slate-400">{group.count}</span>
              </div>
              <div className="space-y-2">
                {group.properties.map((property) => (
                  <PropertyRow
                    key={property._id}
                    property={property}
                    lead={lead}
                    onLeadUpdated={onLeadUpdated}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchTab({ lead, onLeadUpdated }) {
  const [filters, setFilters] = useState({
    location: lead?.interestedLocation || '',
    type: '',
    bhk: '',
    mode: '',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v)
      ).toString();
      const res = await fetch(`/api/properties${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      setResults(data?.success ? data.data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [filters]);

  const change = (key) => (e) => setFilters((p) => ({ ...p, [key]: e.target.value }));
  const select =
    'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface';

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="text"
          value={filters.location}
          onChange={change('location')}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Location or project"
          className={`${select} lg:col-span-2`}
        />
        <select value={filters.type} onChange={change('type')} className={`${select} cursor-pointer`}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={filters.bhk} onChange={change('bhk')} className={`${select} cursor-pointer`}>
          {BHK_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b ? b.toUpperCase() : 'Any BHK'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          Search
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : !searched ? (
        <Empty>Set a filter and hit Search to pull up inventory while you are on the call.</Empty>
      ) : results.length === 0 ? (
        <Empty>No properties matched that search.</Empty>
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-xs font-semibold text-slate-500">{results.length} found</p>
          {results.map((property) => (
            <PropertyRow key={property._id} property={property} lead={lead} onLeadUpdated={onLeadUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyRow({ property, lead, onLeadUpdated }) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const propertyUrl = () => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}${generatePropertyUrl(property)}`;
  };

  const share = async () => {
    const phone = cleanPhone(lead?.phone);
    const url = propertyUrl();

    const message =
      `Hi ${lead?.name || ''}, as discussed — ${property.title}\n` +
      `${property.location}\n` +
      `${property.price ? formatPrice(property.price) : 'Price on request'}` +
      `${property.bhk ? ` · ${property.bhk.toUpperCase()}` : ''}\n\n${url}`;

    // Open WhatsApp first so the click is still inside the user gesture —
    // browsers block window.open once an await has resolved.
    if (phone) {
      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setSharing(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead._id,
          action: 'addNote',
          note: `Shared property during call: ${property.title} (${property.location}) — ${url}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        onLeadUpdated?.(data.data);
        setShared(true);
      }
    } catch {
      // The WhatsApp hand-off already happened; a failed note must not look
      // like the share itself failed.
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-primary/40">
      <img
        src={property.gallery?.[0] || 'https://via.placeholder.com/120x90?text=No+Image'}
        alt={property.title}
        className="h-16 w-20 shrink-0 rounded-xl object-cover"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{property.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {property.location}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-primary">
            {property.price ? formatPrice(property.price) : 'Price on request'}
          </span>
          {property.bhk && property.bhk !== 'na' && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              {property.bhk.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={share}
          disabled={sharing}
          title={lead?.phone ? 'Send on WhatsApp and log it' : 'Lead has no phone number'}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
            shared
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[#25D366] text-white hover:bg-[#1da851] disabled:opacity-60'
          }`}
        >
          {sharing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : shared ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {shared ? 'Sent' : 'Share'}
        </button>

        <a
          href={generatePropertyUrl(property)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
      <p className="mx-auto max-w-sm text-sm text-slate-500">{children}</p>
    </div>
  );
}
