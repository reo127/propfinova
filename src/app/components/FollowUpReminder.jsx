'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Phone, Clock, ArrowRight } from 'lucide-react';

const POLL_MS = 60_000;

/**
 * Reminder popup for follow-ups that have come due.
 *
 * Mounted once in the admin and agent layouts. Polls every minute and shows
 * anything scheduled at or before now, including follow-ups already overdue —
 * a reminder missed while logged out would otherwise never be seen.
 *
 * Dismissals are kept per lead for the life of the tab, so closing one does
 * not make it reappear on the next poll. A reload deliberately brings it back:
 * the follow-up is still outstanding until someone actions the lead.
 */
export default function FollowUpReminder() {
  const router = useRouter();
  const [due, setDue] = useState([]);
  const dismissed = useRef(new Set());

  // Read at click time rather than held in state: it avoids a setState inside
  // an effect, and the role cannot change without a fresh sign-in anyway.
  const leadHref = (id) => {
    let role = null;
    try {
      role = JSON.parse(localStorage.getItem('user') || '{}').role;
    } catch {
      /* a malformed user blob just falls through to the admin route */
    }
    return role === 'agent' ? `/agent/my-leads/${id}` : `/admin/crm/leads/${id}`;
  };

  const check = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const res = await fetch('/api/leads/follow-ups/due', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      if (!data?.success) return;

      // Decide overdue-ness here rather than during render: reading the clock
      // while rendering is an impure call and the value is fixed per poll.
      const now = Date.now();
      setDue(
        data.data
          .filter((lead) => !dismissed.current.has(lead._id))
          .map((lead) => ({
            ...lead,
            overdue: now - new Date(lead.followUpDate).getTime() > 60_000,
          }))
      );
    } catch {
      // A failed poll is not worth surfacing — the next one is a minute away.
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, POLL_MS);

    // Catch up immediately when the tab regains focus, rather than waiting
    // out the rest of the interval.
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  const dismiss = (id) => {
    dismissed.current.add(id);
    setDue((prev) => prev.filter((lead) => lead._id !== id));
  };

  if (due.length === 0) return null;

  const lead = due[0];
  const when = new Date(lead.followUpDate);

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(22rem,calc(100vw-2.5rem))]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-primary/5 px-4 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-btn-text">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              {lead.overdue ? 'Follow-up overdue' : 'Follow-up due now'}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {when.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {due.length > 1 && <span className="ml-1 font-semibold">· {due.length - 1} more</span>}
            </p>
          </div>
          <button
            onClick={() => dismiss(lead._id)}
            aria-label="Dismiss reminder"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <p className="truncate text-base font-bold text-slate-900">{lead.name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {lead.interestedLocation}
            {lead.assignedTo?.name ? ` · ${lead.assignedTo.name}` : ''}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
            >
              <Phone className="h-3.5 w-3.5" />
              {lead.phone}
            </a>
            <button
              onClick={() => {
                dismiss(lead._id);
                router.push(leadHref(lead._id));
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-btn-text transition-colors hover:bg-primary-dark cursor-pointer"
            >
              Open lead
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
