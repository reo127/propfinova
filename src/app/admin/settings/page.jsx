'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePropertyStore } from '@/stores';
import { uploadImage } from '@/lib/uploadImage';
import { ACCEPT_IMAGES } from '@/lib/uploadTypes';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  Database,
  Lock,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Palette,
  Upload,
  Pencil,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';
import ThemePanel from './ThemePanel';

const EMPTY_SLIDE = { image: '', title: '', subtitle: '', link: '', alt: '' };

export default function AdminSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Homepage Slider state
  const [slides, setSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  // drafts = the slides being added right now, one row per image
  const [drafts, setDrafts] = useState([]);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [slideError, setSlideError] = useState('');
  const [slideNotice, setSlideNotice] = useState('');
  const [slideSaving, setSlideSaving] = useState(false);
  const [slideProgress, setSlideProgress] = useState('');

  // Hero image state (single image next to the homepage headline)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroForm, setHeroForm] = useState({
    image: '', alt: '', statLabel: '', statValue: '',
    topCitiesText: '', popularLocalitiesText: '',
    aboutImage: '', aboutTitle: '', aboutSubtitle: ''
  });
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroError, setHeroError] = useState('');
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    companyName: 'PropFinova',
    tagline: '',
    phone: '',
    whatsapp: '',
    email: '',
    reraNumber: '',
    address: '',
    autoAssignLeads: true,
    skipInactiveAgents: true,
    duplicateThresholdDays: '30',
    slaFollowUpHours: '24',
    enablePublicRegistration: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }

      const storedSettings = localStorage.getItem('propfinova_admin_settings');
      if (storedSettings) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) }));
        } catch (e) {
          console.error('Error loading stored settings:', e);
        }
      }
    }
  }, [router]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('propfinova_admin_settings', JSON.stringify(settings));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Homepage Slider handlers
  const fetchSlides = async () => {
    setSlidesLoading(true);
    try {
      const response = await fetch('/api/banners');
      const data = await response.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setSlidesLoading(false);
    }
  };

  const fetchHeroImage = async () => {
    try {
      const response = await fetch('/api/hero-image');
      const data = await response.json();
      if (data.success) {
        setHeroForm({
          image: data.data.image || '',
          alt: data.data.alt || '',
          statLabel: data.data.statLabel || '',
          statValue: data.data.statValue || '',
          topCitiesText: (data.data.topCities || []).join(', '),
          popularLocalitiesText: (data.data.popularLocalities || []).join(', '),
          aboutImage: data.data.aboutImage || '',
          aboutTitle: data.data.aboutTitle || '',
          aboutSubtitle: data.data.aboutSubtitle || '',
        });
      }
    } catch (error) {
      console.error('Error loading hero image:', error);
    } finally {
      setHeroImageLoaded(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'slider' && slides.length === 0 && !slidesLoading) {
      fetchSlides();
    }
    if (activeTab === 'slider' && !heroImageLoaded) {
      fetchHeroImage();
    }
  }, [activeTab]);

  const handleHeroImageUpload = async (e, field = 'image') => {
    const file = e.target.files[0];
    if (!file) return;

    setHeroImageUploading(true);
    setHeroError('');

    try {
      const { url } = await uploadImage(file);
      setHeroForm((prev) => ({ ...prev, [field]: url }));
    } catch (error) {
      setHeroError(error.message);
    } finally {
      setHeroImageUploading(false);
      e.target.value = '';
    }
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    if (!heroForm.image) {
      setHeroError('An image is required');
      return;
    }

    setHeroSaving(true);
    setHeroError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        image: heroForm.image,
        alt: heroForm.alt,
        statLabel: heroForm.statLabel,
        statValue: heroForm.statValue,
        topCities: heroForm.topCitiesText.split(',').map((c) => c.trim()).filter((c) => c),
        popularLocalities: heroForm.popularLocalitiesText.split(',').map((l) => l.trim()).filter((l) => l),
        aboutImage: heroForm.aboutImage,
        aboutTitle: heroForm.aboutTitle,
        aboutSubtitle: heroForm.aboutSubtitle,
      };
      const response = await fetch('/api/hero-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        usePropertyStore.getState().invalidateHeroImage();
        setHeroSaved(true);
        setTimeout(() => setHeroSaved(false), 3000);
      } else {
        setHeroError(data.message || 'Failed to save hero image');
      }
    } catch (error) {
      setHeroError('Failed to save hero image');
      console.error('Error saving hero image:', error);
    } finally {
      setHeroSaving(false);
    }
  };

  const makeDraft = (extra = {}) => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...EMPTY_SLIDE,
    fileName: '',
    uploading: false,
    error: '',
    ...extra,
  });

  const updateDraft = (key, patch) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const removeDraft = (key) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  // Pick many images at once - each one becomes its own slide row
  const handleSlideImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setSlideError('');
    setSlideNotice('');

    // Editing one slide: swap the image on that row, keep the text already typed there
    if (editingSlideId) {
      const row = drafts[0];
      if (!row) return;
      updateDraft(row.key, { uploading: true, fileName: files[0].name, error: '' });
      try {
        const { url } = await uploadImage(files[0]);
        updateDraft(row.key, { image: url, uploading: false });
      } catch (error) {
        updateDraft(row.key, { uploading: false, error: error.message });
      }
      return;
    }

    const rows = files.map((file) => makeDraft({ uploading: true, fileName: file.name }));
    setDrafts((prev) => [...prev, ...rows]);

    await Promise.all(
      files.map(async (file, i) => {
        try {
          const { url } = await uploadImage(file);
          updateDraft(rows[i].key, { image: url, uploading: false, error: '' });
        } catch (error) {
          updateDraft(rows[i].key, { uploading: false, error: error.message });
        }
      })
    );
  };

  const handleSlideEdit = (slide) => {
    setEditingSlideId(slide._id);
    setDrafts([
      makeDraft({
        image: slide.image || '',
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        link: slide.link || '',
        alt: slide.alt || '',
      }),
    ]);
    setSlideError('');
    setSlideNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlideCancel = () => {
    setEditingSlideId(null);
    setDrafts([]);
    setSlideError('');
    setSlideNotice('');
  };

  const saveOneSlide = async (draft, token) => {
    const url = editingSlideId ? `/api/banners/${editingSlideId}` : '/api/banners';
    const response = await fetch(url, {
      method: editingSlideId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: draft.image,
        title: draft.title,
        subtitle: draft.subtitle,
        link: draft.link,
        alt: draft.alt,
      }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'This slide could not be saved.');
  };

  const handleSlideSubmit = async (e) => {
    e.preventDefault();

    const ready = drafts.filter((d) => d.image && !d.uploading);
    if (ready.length === 0) {
      setSlideError(
        drafts.some((d) => d.uploading)
          ? 'Images are still uploading. Please wait a moment and try again.'
          : 'Add at least one image before saving.'
      );
      return;
    }

    setSlideSaving(true);
    setSlideError('');
    setSlideNotice('');

    const token = localStorage.getItem('token');
    const failed = [];

    for (let i = 0; i < ready.length; i++) {
      setSlideProgress(`Saving slide ${i + 1} of ${ready.length}...`);
      try {
        await saveOneSlide(ready[i], token);
      } catch (error) {
        console.error('Error saving slide:', error);
        failed.push({
          ...ready[i],
          error: error instanceof TypeError
            ? 'Could not reach the server. Please check your internet connection.'
            : error.message,
        });
      }
    }

    setSlideProgress('');
    setSlideSaving(false);
    await fetchSlides();
    usePropertyStore.getState().invalidateBanners();

    const saved = ready.length - failed.length;
    // keep anything that failed to upload or failed to save so nothing is silently lost
    const unfinished = drafts.filter((d) => d.uploading || !d.image);
    setDrafts([...unfinished, ...failed]);

    if (failed.length === 0) {
      setEditingSlideId(null);
      setSlideNotice(
        editingSlideId
          ? 'Slide updated successfully.'
          : `${saved} slide${saved === 1 ? '' : 's'} added to the homepage slider.`
      );
    } else {
      setSlideError(
        saved > 0
          ? `${saved} slide${saved === 1 ? '' : 's'} saved. ${failed.length} could not be saved - see the message on each one below.`
          : 'Nothing could be saved. See the message on each slide below.'
      );
    }
  };

  const handleSlideDelete = async (id) => {
    if (!confirm('Delete this slide? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setSlides((prev) => prev.filter((s) => s._id !== id));
        usePropertyStore.getState().invalidateBanners();
      } else {
        alert(data.message || 'Failed to delete slide');
      }
    } catch (error) {
      alert('Failed to delete slide');
      console.error('Error deleting slide:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              System Settings &amp; Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configure enterprise brand profile, lead routing automation, SLA policies, and database tools.
          </p>
        </div>

        {/* Only the Agency Profile tab is saved by this button. Showing it on the
            other tabs made it look like it saved banners, hero images or colours
            too — it never did, and the success toast hid the fact. */}
        {activeTab === 'general' && (
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs self-start md:self-auto cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Agency Profile</span>
          </button>
        )}
      </div>

      {/* Save Notification */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">System preferences and agency configuration saved successfully.</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-1.5 border-b border-slate-200/80 pb-px overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'general'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Agency Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'automation'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Lead Routing &amp; SLAs</span>
        </button>

        <button
          onClick={() => setActiveTab('slider')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'slider'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Banners &amp; Hero Images</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'appearance'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Theme &amp; Colours</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'tools'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Maintenance &amp; Data Tools</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'border-primary text-primary bg-surface shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security &amp; Environment</span>
        </button>
      </div>

      {/* Tab 1: General Agency Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Corporate Identity &amp; Contact Info</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on public listing pages, client emails, and RERA disclosures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                RERA Registration Number
              </label>
              <input
                type="text"
                value={settings.reraNumber}
                onChange={(e) => handleChange('reraNumber', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Official Hotline Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                WhatsApp Business Support
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Official Customer Support Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Corporate Headquarters Address
              </label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save Agency Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Lead Routing & Automation Rules */}
      {activeTab === 'automation' && (
        <form onSubmit={handleSave} className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Lead Intake &amp; Assignment Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the automatic round-robin assignment engine and advisor SLA thresholds.
            </p>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Auto Assign */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">Auto-Assign New Leads</div>
                <p className="text-[11px] text-slate-500">
                  Automatically allocate incoming inquiries to active sales advisors via fair round-robin rotation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAssignLeads}
                onChange={(e) => handleChange('autoAssignLeads', e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            {/* Toggle 2: Skip Inactive */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">Bypass Inactive Advisors</div>
                <p className="text-[11px] text-slate-500">
                  Do not route new prospects to advisors who have toggled their status to paused/inactive.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.skipInactiveAgents}
                onChange={(e) => handleChange('skipInactiveAgents', e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            {/* SLA Threshold */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">Initial Call SLA Window</div>
                <p className="text-[11px] text-slate-500">
                  Mark leads as overdue if advisor fails to log an initial call within this window.
                </p>
              </div>
              <select
                value={settings.slaFollowUpHours}
                onChange={(e) => handleChange('slaFollowUpHours', e.target.value)}
                className="px-3 py-1.5 bg-surface border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-primary"
              >
                <option value="4">4 Hours (Aggressive)</option>
                <option value="12">12 Hours (Standard)</option>
                <option value="24">24 Hours (Default)</option>
                <option value="48">48 Hours (Relaxed)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save Automation Rules
            </button>
          </div>
        </form>
      )}

      {/* Tab: Homepage Slider */}
      {activeTab === 'slider' && (
        <div className="space-y-6">
          <form onSubmit={handleSlideSubmit} className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingSlideId ? 'Edit Slide' : 'Add Slides'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingSlideId
                    ? 'Change the image or text for this slide, then save.'
                    : 'Choose several images at once - each one becomes a slide you can give its own title and sub-text before saving them all together.'}
                </p>
              </div>
              {(editingSlideId || drafts.length > 0) && (
                <button
                  type="button"
                  onClick={handleSlideCancel}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{editingSlideId ? 'Cancel' : 'Clear all'}</span>
                </button>
              )}
            </div>

            {slideError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{slideError}</span>
              </div>
            )}

            {slideNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{slideNotice}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {editingSlideId ? 'Replace Image' : 'Upload Images'}
                <input
                  type="file"
                  onChange={handleSlideImageUpload}
                  accept={ACCEPT_IMAGES}
                  multiple={!editingSlideId}
                  className="hidden"
                  disabled={slideSaving}
                />
              </label>
              {!editingSlideId && (
                <button
                  type="button"
                  onClick={() => setDrafts((prev) => [...prev, makeDraft()])}
                  disabled={slideSaving}
                  className="px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add by URL
                </button>
              )}
              <p className="text-[11px] text-slate-500">JPG, PNG or WebP, up to 4MB each.</p>
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
                <ImageIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No slides queued yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hit &quot;Upload Images&quot; and select as many photos as you want - hold Shift or Cmd to pick several.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.key}
                    className={`rounded-2xl border p-4 space-y-4 ${
                      draft.error ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                        {draft.uploading ? (
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Uploading</span>
                        ) : draft.image ? (
                          <img src={draft.image} alt={draft.alt || 'Slide preview'} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Slide {index + 1}
                            {draft.fileName && <span className="normal-case tracking-normal text-slate-400 font-semibold"> &middot; {draft.fileName}</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeDraft(draft.key)}
                            disabled={slideSaving}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-surface transition-colors disabled:opacity-50"
                            aria-label={`Remove slide ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={draft.image}
                          onChange={(e) => updateDraft(draft.key, { image: e.target.value, error: '' })}
                          placeholder="Image URL (filled in automatically after upload)"
                          className="w-full px-3 py-2 bg-surface border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary"
                        />
                        {draft.error && (
                          <p className="text-[11px] font-semibold text-rose-700 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                            <span>{draft.error}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Title</label>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => updateDraft(draft.key, { title: e.target.value })}
                          placeholder="Luxury Apartments Available"
                          className="w-full px-3 py-2 bg-surface border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={draft.subtitle}
                          onChange={(e) => updateDraft(draft.key, { subtitle: e.target.value })}
                          placeholder="Starting from ₹85L - Limited Time Offer"
                          className="w-full px-3 py-2 bg-surface border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Link (optional)</label>
                        <input
                          type="text"
                          value={draft.link}
                          onChange={(e) => updateDraft(draft.key, { link: e.target.value })}
                          placeholder="/search?q=luxury+apartments"
                          className="w-full px-3 py-2 bg-surface border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Alt Text (optional)</label>
                        <input
                          type="text"
                          value={draft.alt}
                          onChange={(e) => updateDraft(draft.key, { alt: e.target.value })}
                          placeholder="Luxury apartment complex"
                          className="w-full px-3 py-2 bg-surface border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {/* An uploaded image is only a file on disk until this button posts
                  it — say so, or it looks already saved. */}
              {drafts.length > 0 && !slideSaving && !drafts.some((d) => d.uploading) && (
                <p className="mr-auto flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Not published yet — click {editingSlideId ? 'Update Slide' : 'Add Slides'} to put {drafts.length === 1 ? 'it' : 'them'} on the homepage.
                </p>
              )}
              {slideProgress && <p className="text-[11px] font-semibold text-slate-500">{slideProgress}</p>}
              <button
                type="submit"
                disabled={slideSaving || drafts.length === 0 || drafts.some((d) => d.uploading)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {slideSaving
                    ? 'Saving...'
                    : editingSlideId
                      ? 'Update Slide'
                      : drafts.length === 0
                        ? 'Add Slides'
                        : `Add ${drafts.length} Slide${drafts.length === 1 ? '' : 's'}`}
                </span>
              </button>
            </div>
          </form>

          <div className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Current Slides {slides.length > 0 && `(${slides.length})`}
            </h2>

            {slidesLoading ? (
              <p className="text-xs text-slate-500">Loading slides...</p>
            ) : slides.length === 0 ? (
              <p className="text-xs text-slate-500">No slides yet. Add one above to populate the homepage hero slider.</p>
            ) : (
              <div className="space-y-3">
                {slides.map((slide) => (
                  <div key={slide._id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 bg-slate-50">
                    <img src={slide.image} alt={slide.alt || slide.title || 'Slide'} className="w-20 h-14 rounded-xl object-cover shrink-0 bg-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{slide.title || 'Untitled slide'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{slide.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSlideEdit(slide)}
                        className="p-2 rounded-lg text-slate-600 hover:text-primary hover:bg-surface transition-colors"
                        aria-label="Edit slide"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSlideDelete(slide._id)}
                        className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-surface transition-colors"
                        aria-label="Delete slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleHeroSubmit} className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Hero Image</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The single photo shown beside the headline &quot;A home search built on what&apos;s actually true about the property.&quot;
              </p>
            </div>

            {heroError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{heroError}</span>
              </div>
            )}

            {heroSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Hero image saved successfully.</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Image *
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {heroImageUploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" onChange={handleHeroImageUpload} accept={ACCEPT_IMAGES} className="hidden" disabled={heroImageUploading} />
                </label>
                <input
                  type="text"
                  value={heroForm.image}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="or paste a direct image URL"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
                />
              </div>
              {heroForm.image && (
                <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-200 h-48 w-40 bg-slate-950">
                  <img src={heroForm.image} alt="Hero preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Alt Text</label>
              <input
                type="text"
                value={heroForm.alt}
                onChange={(e) => setHeroForm((prev) => ({ ...prev, alt: e.target.value }))}
                placeholder="Bangalore skyline, one of the cities PropFinova lists properties in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Stat Card Label</label>
                <input
                  type="text"
                  value={heroForm.statLabel}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, statLabel: e.target.value }))}
                  placeholder="Across six cities, right now"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Stat Card Value</label>
                <input
                  type="text"
                  value={heroForm.statValue}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, statValue: e.target.value }))}
                  placeholder="New listings added weekly"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Top Cities (Comma Separated)
              </label>
              <input
                type="text"
                value={heroForm.topCitiesText}
                onChange={(e) => setHeroForm((prev) => ({ ...prev, topCitiesText: e.target.value }))}
                placeholder="Bangalore, Mumbai, Pune, Hyderabad, Chennai, Delhi NCR"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Popular Localities (Comma Separated)
              </label>
              <input
                type="text"
                value={heroForm.popularLocalitiesText}
                onChange={(e) => setHeroForm((prev) => ({ ...prev, popularLocalitiesText: e.target.value }))}
                placeholder="Whitefield, Bengaluru, Baner, Pune, Andheri, Mumbai"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">About Page Hero</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Background image and headline shown at the top of the /about page.
              </p>

              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Background Image
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {heroImageUploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" onChange={(e) => handleHeroImageUpload(e, 'aboutImage')} accept={ACCEPT_IMAGES} className="hidden" disabled={heroImageUploading} />
                </label>
                <input
                  type="text"
                  value={heroForm.aboutImage}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, aboutImage: e.target.value }))}
                  placeholder="or paste a direct image URL"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
                />
              </div>
              {heroForm.aboutImage && (
                <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-200 h-32 w-full bg-slate-950">
                  <img src={heroForm.aboutImage} alt="About hero preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Headline</label>
                <input
                  type="text"
                  value={heroForm.aboutTitle}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, aboutTitle: e.target.value }))}
                  placeholder="About *PropFinova*"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface"
                />
                <p className="text-[11px] text-slate-400 mt-1">Wrap words in *asterisks* to show them in the yellow accent colour.</p>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sub-headline</label>
                <textarea
                  rows={2}
                  value={heroForm.aboutSubtitle}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, aboutSubtitle: e.target.value }))}
                  placeholder="Your trusted partner in real estate excellence, connecting dreams with reality since our inception."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs outline-none focus:border-primary focus:bg-surface resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={heroSaving || heroImageUploading}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{heroSaving ? 'Saving...' : 'Save Hero Images'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Theme & Colours — all controls live in ThemePanel, which
          generates them from src/lib/themeTokens.js */}
      {activeTab === 'appearance' && <ThemePanel />}

      {/* Tab 3: Maintenance & Data Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duplicate Checker Link */}
            <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 pt-2">Duplicate Lead Detection</h3>
                <p className="text-xs text-slate-500">
                  Run database integrity scans to detect identical prospect telephone numbers across multiple agents.
                </p>
              </div>
              <Link
                href="/admin/duplicate-checker"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>Run Duplicate Scan</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Agent Lead Cleanup Tool */}
            <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 pt-2">Agent Queue Sanitizer</h3>
                <p className="text-xs text-slate-500">
                  Bulk unassign or clear stale leads from inactive advisor pipelines back to the unassigned queue.
                </p>
              </div>
              <Link
                href="/admin/cleanup-agent-leads"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>Access Lead Sanitizer</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Environment */}
      {activeTab === 'security' && (
        <div className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Security &amp; Environment Diagnostics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live server connection parameters, environment state, and RBAC authentication level.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Active Session Privilege</span>
              <span className="font-bold text-slate-900 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Super Administrator</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Database Layer</span>
              <span className="font-bold text-emerald-600">Connected (MongoDB Atlas)</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Runtime Architecture</span>
              <span className="font-bold text-slate-900">Next.js App Router (Turbopack)</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Deployment Platform</span>
              <span className="font-bold text-slate-900">Vercel Enterprise Edge</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
