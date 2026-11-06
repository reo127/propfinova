'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  RotateCcw,
  Save,
  Sparkles,
  Type,
} from 'lucide-react';
import {
  COLOR_TOKENS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  PRESET_FAMILIES,
  THEME_PRESETS,
  contrastWarnings,
  isHexColor,
  normalizeTheme,
} from '@/lib/themeTokens';

/**
 * Settings > Theme & Colours.
 *
 * Every control here is generated from COLOR_TOKENS / FONT_OPTIONS in
 * src/lib/themeTokens.js, which is also what the model, the API and the
 * root layout read. Adding a token there makes a control appear here.
 *
 * Edits paint onto document.documentElement straight away so the whole admin
 * UI previews the change live; nothing is persisted until Save.
 */

const GROUPS = ['Brand', 'Surfaces', 'Text'];

const GROUP_BLURB = {
  Brand: 'The colours that carry your identity. Secondary also tints every grey in the app.',
  Surfaces: 'What sits behind and around your content.',
  Text: 'Reading colours. Keep these high-contrast against the surfaces above.',
};

/**
 * Tokens that are safe to paint onto the surrounding admin UI while editing.
 *
 * Deliberately excludes surface/background/foreground/muted: those drive the
 * legibility of this very form, so a dark Card Surface or a pale Ink would
 * leave the admin editing an unreadable page. They are previewed faithfully
 * in the Preview section instead, which uses inline styles.
 */
const LIVE_PAINT_KEYS = ['primary', 'accent', 'btnText'];

/** Paint the safe tokens onto :root so the admin chrome previews the brand. */
function paintPreview(theme) {
  const root = document.documentElement;
  const safe = normalizeTheme(theme);
  for (const token of COLOR_TOKENS) {
    if (!LIVE_PAINT_KEYS.includes(token.key)) continue;
    root.style.setProperty(token.cssVar, safe[token.key]);
  }
}

/** Remove the inline overrides, falling back to the server-rendered theme. */
function clearPreview() {
  const root = document.documentElement;
  for (const token of COLOR_TOKENS) {
    root.style.removeProperty(token.cssVar);
  }
}

export default function ThemePanel() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [savedTheme, setSavedTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/theme');
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          const loaded = normalizeTheme(data.data);
          setTheme(loaded);
          setSavedTheme(loaded);
        }
      } catch {
        if (!cancelled) setError('Could not load the saved theme. Showing defaults.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Drop the live overrides when leaving the tab, otherwise an unsaved
    // experiment would keep colouring the admin UI.
    return () => {
      cancelled = true;
      clearPreview();
    };
  }, []);

  // Paint on every edit so the surrounding admin chrome previews the theme.
  useEffect(() => {
    if (!loading) paintPreview(theme);
  }, [theme, loading]);

  const warnings = useMemo(() => contrastWarnings(theme), [theme]);
  const invalidHex = COLOR_TOKENS.filter((t) => !isHexColor(theme[t.key]));
  const dirty = useMemo(
    () => JSON.stringify(normalizeTheme(theme)) !== JSON.stringify(normalizeTheme(savedTheme)),
    [theme, savedTheme]
  );

  const setToken = (key, value) => {
    setSaved(false);
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (values) => {
    setSaved(false);
    setError('');
    // Functional update — a preset button clicked twice in one tick would
    // otherwise merge onto a stale `theme`.
    setTheme((prev) => ({ ...prev, ...values }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');

    if (invalidHex.length > 0) {
      setError(
        `Fix these before saving — they need a 6-digit hex like #17855A: ${invalidHex
          .map((t) => t.label)
          .join(', ')}`
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(normalizeTheme(theme)),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || 'Could not save the theme');
        return;
      }

      const persisted = normalizeTheme(data.data);
      setTheme(persisted);
      setSavedTheme(persisted);
      setSaved(true);
    } catch {
      setError('Could not save the theme. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-slate-200/80 p-8 shadow-xs">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 bg-slate-100 rounded" />
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Presets                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-5">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Start from a preset</h2>
            <p className="text-xs text-slate-500 mt-1">
              {THEME_PRESETS.length} ready-made palettes. Each loads a full set of colours into
              the controls below — nothing is saved until you press Save Theme, so try them
              freely. All but Classic Gold are contrast-checked to WCAG AA.
            </p>
          </div>
        </div>

        {/* Grouped by hue family — a flat grid of fourteen swatches is hard
            to scan, and the families are how someone actually decides. */}
        <div className="space-y-6">
          {PRESET_FAMILIES.map((family) => {
            const presets = THEME_PRESETS.filter((p) => p.family === family);
            if (presets.length === 0) return null;

            return (
              <div key={family}>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {family}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {presets.map((preset) => {
                    const active = COLOR_TOKENS.every(
                      (t) => theme[t.key] === preset.values[t.key]
                    );

                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset.values)}
                        aria-pressed={active}
                        className={`group relative text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? 'border-primary ring-2 ring-primary/25 shadow-sm'
                            : 'border-slate-200 hover:border-primary hover:shadow-sm'
                        }`}
                      >
                        {active && (
                          <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
                        )}

                        {/* Swatch order mirrors visual weight on a page:
                            primary, ink, accent, then the canvas. */}
                        <div className="mb-3 flex gap-1.5">
                          {['primary', 'secondary', 'accent', 'background'].map((key) => (
                            <span
                              key={key}
                              className="h-6 w-6 rounded-lg border border-black/10"
                              style={{ backgroundColor: preset.values[key] }}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 transition-colors group-hover:text-primary">
                            {preset.name}
                          </span>
                          {preset.accessible === false && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 shrink-0 text-amber-500"
                              title="This palette does not meet AA contrast"
                            />
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Colour tokens                                                    */}
      {/* ---------------------------------------------------------------- */}
      {GROUPS.map((group) => {
        const tokens = COLOR_TOKENS.filter((t) => t.group === group);
        if (tokens.length === 0) return null;

        return (
          <section
            key={group}
            className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-base font-bold text-slate-900">{group}</h2>
              <p className="text-xs text-slate-500 mt-1">{GROUP_BLURB[group]}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {tokens.map((token) => {
                const value = theme[token.key] ?? '';
                const valid = isHexColor(value);
                const changed = value !== token.default;

                return (
                  <div key={token.key} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <label
                        htmlFor={`theme-${token.key}`}
                        className="text-[11px] font-bold text-slate-600 uppercase tracking-wider"
                      >
                        {token.label}
                      </label>
                      {changed && (
                        <button
                          type="button"
                          onClick={() => setToken(token.key, token.default)}
                          className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-wider cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* The swatch and the hex field are two views of one
                          value, so either can drive it. */}
                      <input
                        type="color"
                        value={valid ? value : token.default}
                        onChange={(e) => setToken(token.key, e.target.value.toUpperCase())}
                        className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 cursor-pointer bg-surface p-1"
                        aria-label={`${token.label} colour picker`}
                      />
                      <input
                        id={`theme-${token.key}`}
                        type="text"
                        value={value}
                        onChange={(e) => setToken(token.key, e.target.value.toUpperCase())}
                        placeholder={token.default}
                        maxLength={7}
                        spellCheck={false}
                        className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm font-mono tracking-wide text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          valid ? 'border-slate-200' : 'border-rose-300 bg-rose-50/50'
                        }`}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">{token.hint}</p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ---------------------------------------------------------------- */}
      {/* Fonts                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-surface rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-5">
          <Type className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Typography</h2>
            <p className="text-xs text-slate-500 mt-1">
              Body font sets every paragraph, label and button in the app. Heading font is used
              for the large editorial headlines on the homepage, search and property pages.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { field: 'fontBody', label: 'Body / UI Font' },
            { field: 'fontHeading', label: 'Heading Font' },
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <label
                htmlFor={`theme-${field}`}
                className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider"
              >
                {label}
              </label>
              <select
                id={`theme-${field}`}
                value={theme[field]}
                onChange={(e) => setToken(field, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.key} value={font.key}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                {FONT_OPTIONS.find((f) => f.key === theme[field])?.sample}
              </p>
              {/* Only the two selected families are loaded on the public site,
                  so this preview renders in the real face only once saved. */}
              <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-lg text-slate-900 truncate">
                  Premium homes, verified.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">ABCDEFGHIJ · abcdefghij · 0123456789</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Live preview                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-surface rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 sm:px-8 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Preview</h2>
          <p className="text-xs text-slate-500 mt-1">
            A mock property card and navigation bar using your current values — this is the
            accurate preview. The admin screen around you also previews your Primary, Accent and
            Button Label live.
          </p>
        </div>

        {/* Inline styles, not utilities — this block must show the *form*
            values, including ones that have not been painted or saved. */}
        <div className="p-6 sm:p-8" style={{ backgroundColor: theme.background }}>
          {/* mock navbar */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5 mb-5"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <span className="text-sm font-bold" style={{ color: theme.secondary }}>
              PropFinova
            </span>
            <div className="hidden sm:flex items-center gap-5 text-xs font-semibold">
              <span style={{ color: theme.primary }}>Buy</span>
              <span style={{ color: theme.muted }}>New Projects</span>
              <span style={{ color: theme.muted }}>About</span>
            </div>
            <span
              className="px-3.5 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: theme.primary, color: theme.btnText }}
            >
              Sign Up
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* mock property card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <div
                className="h-28 flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.secondary }}
              >
                Property photo
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: theme.secondary }}>
                    3 BHK in Whitefield
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.secondary,
                    }}
                  >
                    Verified
                  </span>
                </div>
                <p className="text-xs" style={{ color: theme.muted }}>
                  Bengaluru · 1,450 sq.ft · Ready to move
                </p>
                <p className="text-base font-bold" style={{ color: theme.primary }}>
                  ₹1.42 Cr
                </p>
                <div className="flex gap-2 pt-1">
                  <span
                    className="flex-1 text-center py-2 rounded-lg text-[11px] font-bold"
                    style={{ backgroundColor: theme.primary, color: theme.btnText }}
                  >
                    Contact
                  </span>
                  <span
                    className="flex-1 text-center py-2 rounded-lg text-[11px] font-bold"
                    style={{
                      color: theme.primary,
                      border: `1px solid ${theme.primary}`,
                    }}
                  >
                    Details
                  </span>
                </div>
              </div>
            </div>

            {/* mock body copy + dark panel */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
              >
                <h3 className="text-sm font-bold mb-1.5" style={{ color: theme.secondary }}>
                  Body text sample
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: theme.foreground }}>
                  This paragraph uses your Body Text colour on the Card Surface. Links like{' '}
                  <span className="font-semibold underline" style={{ color: theme.primary }}>
                    view all listings
                  </span>{' '}
                  use Primary.
                </p>
                <p className="text-[11px] mt-2" style={{ color: theme.muted }}>
                  Muted text — captions, timestamps and helper copy.
                </p>
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: theme.secondary }}>
                <p className="text-xs font-bold" style={{ color: theme.background }}>
                  Dark panel (footer, hero overlay)
                </p>
                <p className="text-[11px] mt-1" style={{ color: theme.accent }}>
                  Accent text on the ink surface
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Messages + actions                                               */}
      {/* ---------------------------------------------------------------- */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {saved && !dirty && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
          <span>Theme saved and live. Reload any open public page to see it there.</span>
        </div>
      )}

      {/* Contrast is a warning, never a block — the admin's choice wins. */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs">
          <div className="flex items-start gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>
              {warnings.length} combination{warnings.length > 1 ? 's' : ''} may be hard to read
            </span>
          </div>
          <ul className="mt-2 ml-6 space-y-1 font-medium">
            {warnings.map((w) => (
              <li key={`${w.fg}-${w.bg}`}>
                {w.label} — {w.ratio.toFixed(1)}:1 (WCAG AA wants 4.5:1)
              </li>
            ))}
          </ul>
          <p className="mt-2 ml-6 text-[11px] text-amber-700">
            You can still save this. Darkening Primary, or switching Button Label between white
            and your Ink colour, usually fixes it.
          </p>
        </div>
      )}

      {warnings.length === 0 && invalidHex.length === 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <Check className="w-4 h-4" />
          <span>All text/background pairings meet WCAG AA contrast.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pb-2">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-btn-text bg-gradient-to-r from-primary to-primary-dark shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : dirty ? 'Save Theme' : 'Saved'}
        </button>

        <button
          type="button"
          onClick={() => {
            setTheme(savedTheme);
            setError('');
            setSaved(false);
          }}
          disabled={!dirty}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Discard changes
        </button>

        <button
          type="button"
          onClick={() => applyPreset(DEFAULT_THEME)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-primary transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset everything to default
        </button>
      </div>
    </form>
  );
}
