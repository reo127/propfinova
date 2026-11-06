/**
 * Theme tokens — the single source of truth for everything the admin can
 * restyle from Settings > Theme & Colours.
 *
 * Four places import this and must never drift apart:
 *   - src/models/Theme.js        (what gets stored + validated)
 *   - src/app/api/theme/route.js (what the PUT accepts)
 *   - src/app/layout.js          (what gets written into the :root <style>)
 *   - src/app/admin/settings     (the controls that are rendered)
 *
 * Adding a new colour control = add one entry to COLOR_TOKENS. Nothing else
 * needs editing; the model, the API, the style tag and the form all read it.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

export const isHexColor = (value) => HEX.test(value || '');

/**
 * Each token maps a stored field onto the CSS custom property that
 * src/app/globals.css already consumes.
 * `group` only drives how the settings form is sectioned.
 */
export const COLOR_TOKENS = [
  {
    key: 'primary',
    cssVar: '--primary',
    label: 'Primary',
    hint: 'Buttons, links, active nav, focus rings',
    default: '#17855A',
    group: 'Brand',
  },
  {
    key: 'secondary',
    cssVar: '--secondary',
    label: 'Secondary / Ink',
    hint: 'Headings, dark panels, footer. Also tints every grey in the app.',
    default: '#10251B',
    group: 'Brand',
  },
  {
    key: 'accent',
    cssVar: '--accent',
    label: 'Accent',
    hint: 'Highlights, badges and soft decorative fills',
    default: '#6FCF9A',
    group: 'Brand',
  },
  {
    key: 'background',
    cssVar: '--background',
    label: 'Page Background',
    hint: 'The canvas behind every page',
    default: '#F3FAF6',
    group: 'Surfaces',
  },
  {
    key: 'surface',
    cssVar: '--surface',
    label: 'Card Surface',
    hint: 'Cards, panels and dropdowns sitting on the background',
    default: '#FFFFFF',
    group: 'Surfaces',
  },
  {
    key: 'border',
    cssVar: '--border',
    label: 'Borders & Dividers',
    hint: 'Hairlines, table rules, input outlines',
    default: '#DCEAE2',
    group: 'Surfaces',
  },
  {
    key: 'foreground',
    cssVar: '--foreground',
    label: 'Body Text',
    hint: 'Default paragraph and label colour',
    default: '#16241D',
    group: 'Text',
  },
  {
    key: 'muted',
    cssVar: '--muted',
    label: 'Muted Text',
    hint: 'Captions, helper text, timestamps',
    default: '#5C7268',
    group: 'Text',
  },
  {
    key: 'btnText',
    cssVar: '--btn-text',
    label: 'Button Label',
    hint: 'Text colour on a filled primary button — keep it readable on Primary',
    default: '#FFFFFF',
    group: 'Text',
  },
];

/**
 * Curated font set. `cssVar` is the variable next/font generates in
 * layout.js; the stored key is all that travels through the API.
 *
 * Only the two selected families are attached to <html>, so the rest never
 * download — see the comment in src/app/layout.js.
 */
export const FONT_OPTIONS = [
  { key: 'jakarta', label: 'Plus Jakarta Sans', cssVar: '--font-jakarta', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Geometric, friendly — the default' },
  { key: 'inter', label: 'Inter', cssVar: '--font-inter', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Neutral workhorse, great at small sizes' },
  { key: 'manrope', label: 'Manrope', cssVar: '--font-manrope', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Rounded and modern' },
  { key: 'dmsans', label: 'DM Sans', cssVar: '--font-dmsans', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Low-contrast, calm' },
  { key: 'outfit', label: 'Outfit', cssVar: '--font-outfit', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Wide, confident geometry' },
  { key: 'poppins', label: 'Poppins', cssVar: '--font-poppins', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Circular and open' },
  { key: 'sora', label: 'Sora', cssVar: '--font-sora', stack: 'ui-sans-serif, system-ui, sans-serif', sample: 'Technical, squared terminals' },
  { key: 'fraunces', label: 'Fraunces', cssVar: '--font-fraunces', stack: 'ui-serif, Georgia, serif', sample: 'Editorial serif — the default heading' },
  { key: 'playfair', label: 'Playfair Display', cssVar: '--font-playfair', stack: 'ui-serif, Georgia, serif', sample: 'High-contrast luxury serif' },
  { key: 'lora', label: 'Lora', cssVar: '--font-lora', stack: 'ui-serif, Georgia, serif', sample: 'Warm, readable serif' },
];

export const FONT_KEYS = FONT_OPTIONS.map((f) => f.key);

export const isFontKey = (value) => FONT_KEYS.includes(value);

/** Resolve a stored font key into a full CSS font-family stack. */
export const fontStack = (key, fallbackKey) => {
  const font =
    FONT_OPTIONS.find((f) => f.key === key) ||
    FONT_OPTIONS.find((f) => f.key === fallbackKey);
  return font ? `var(${font.cssVar}), ${font.stack}` : 'ui-sans-serif, system-ui, sans-serif';
};

export const DEFAULT_FONTS = { fontBody: 'jakarta', fontHeading: 'fraunces' };

export const DEFAULT_THEME = Object.freeze({
  ...Object.fromEntries(COLOR_TOKENS.map((t) => [t.key, t.default])),
  ...DEFAULT_FONTS,
});

/**
 * Coerce an arbitrary object (DB document, request body) into a complete,
 * safe theme. Anything missing or malformed falls back to the default, so
 * callers never have to null-check and nothing unvalidated can reach the
 * <style> tag.
 */
export function normalizeTheme(input) {
  const source = input || {};
  const theme = {};

  for (const token of COLOR_TOKENS) {
    const value = source[token.key];
    theme[token.key] = isHexColor(value) ? value.toUpperCase() : token.default;
  }

  theme.fontBody = isFontKey(source.fontBody) ? source.fontBody : DEFAULT_FONTS.fontBody;
  theme.fontHeading = isFontKey(source.fontHeading)
    ? source.fontHeading
    : DEFAULT_FONTS.fontHeading;

  return theme;
}

/**
 * Build the `:root { ... }` declaration block for a theme.
 * Every value has been through normalizeTheme, so this is safe to inline
 * into a <style> tag.
 */
export function themeToCssVars(theme) {
  const safe = normalizeTheme(theme);
  const decls = COLOR_TOKENS.map((t) => `${t.cssVar}:${safe[t.key]}`);
  decls.push(`--font-body:${fontStack(safe.fontBody, DEFAULT_FONTS.fontBody)}`);
  decls.push(`--font-heading:${fontStack(safe.fontHeading, DEFAULT_FONTS.fontHeading)}`);
  return `:root{${decls.join(';')};}`;
}

/* ---------------------------------------------------------------------------
   Contrast checking.

   Full colour control makes it easy to save something unreadable (a pale
   mint primary with white button text, say). These are used by the settings
   page to warn — never to block: the admin's choice still wins.
   --------------------------------------------------------------------------- */

/** WCAG 2.1 relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex) {
  if (!isHexColor(hex)) return 0;
  const channel = (pair) => {
    const srgb = parseInt(pair, 16) / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const r = channel(hex.slice(1, 3));
  const g = channel(hex.slice(3, 5));
  const b = channel(hex.slice(5, 7));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours, 1 (identical) to 21. */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The pairings that actually have to stay legible, checked against WCAG AA
 * for normal-size text (4.5:1).
 */
export const CONTRAST_CHECKS = [
  { fg: 'btnText', bg: 'primary', label: 'Button label on Primary' },
  { fg: 'foreground', bg: 'background', label: 'Body text on Page Background' },
  { fg: 'foreground', bg: 'surface', label: 'Body text on Card Surface' },
  { fg: 'muted', bg: 'surface', label: 'Muted text on Card Surface' },
  { fg: 'primary', bg: 'surface', label: 'Links on Card Surface' },
  // Accent carries label text on the dark hero/footer panels, and is the
  // badge fill that Secondary sits on — both have to stay legible.
  { fg: 'accent', bg: 'secondary', label: 'Accent text on dark panels' },
  { fg: 'secondary', bg: 'accent', label: 'Badge text on Accent' },
];

/** Returns one entry per failing pairing; an empty array means all good. */
export function contrastWarnings(theme) {
  const safe = normalizeTheme(theme);
  return CONTRAST_CHECKS.map(({ fg, bg, label }) => {
    const ratio = contrastRatio(safe[fg], safe[bg]);
    return { fg, bg, label, ratio, passes: ratio >= 4.5 };
  }).filter((check) => !check.passes);
}

/* ---------------------------------------------------------------------------
   Preset library.

   Each palette follows the same recipe, which is what keeps the set coherent
   rather than fourteen unrelated colour schemes:

     primary     deep, saturated hue — must clear 4.5:1 against white button
                 text, so it is always darker than the "light theme" instinct
                 suggests. The airiness comes from background/accent, never
                 from a pale primary.
     secondary   near-black version of the same hue. Also tints every grey in
                 the app, so it carries the theme into the admin and CRM.
     accent      light tint of the hue — badge fills, highlight text on the
                 dark panels. Light enough for ink text to sit on it.
     background  barely-there tint of the hue, 2-4% saturation.
     surface     white, so photography and cards stay neutral.
     border      light hue-tinted hairline, never pure grey.
     foreground  hue-tinted near-black for body copy.
     muted       mid-tone at ~5:1 on white — readable, clearly secondary.

   `family` only groups the swatches in the settings picker.
   Every preset is contrast-verified by src/lib/themeTokens.test.mjs.
   --------------------------------------------------------------------------- */
export const THEME_PRESETS = [
  // ---- Greens -------------------------------------------------------------
  {
    name: 'Light Green',
    family: 'Green',
    description: 'The default — soft, airy, trustworthy',
    values: { ...DEFAULT_THEME },
  },
  {
    name: 'Mint Fresh',
    family: 'Green',
    description: 'Cooler green, crisp white cards',
    values: {
      ...DEFAULT_THEME,
      primary: '#0A7D60',
      secondary: '#0B2A24',
      accent: '#5EE3B4',
      background: '#F0FBF7',
      border: '#D2EDE3',
      foreground: '#102A23',
      muted: '#4F7468',
    },
  },
  {
    name: 'Sage & Stone',
    family: 'Green',
    description: 'Muted green on a warm grey canvas',
    values: {
      ...DEFAULT_THEME,
      primary: '#4F7C62',
      secondary: '#23302A',
      accent: '#A8C3B2',
      background: '#F6F7F4',
      border: '#E2E6DF',
      foreground: '#1F2A24',
      muted: '#67766D',
    },
  },
  {
    name: 'Forest Premium',
    family: 'Green',
    description: 'Deep pine — reads high-end and established',
    values: {
      ...DEFAULT_THEME,
      primary: '#166A47',
      secondary: '#0C1F16',
      accent: '#8FD9B6',
      background: '#F2F8F4',
      border: '#D8E8DF',
      foreground: '#13241B',
      muted: '#55695E',
    },
  },
  {
    name: 'Eucalyptus',
    family: 'Green',
    description: 'Green leaning teal — calm and modern',
    values: {
      ...DEFAULT_THEME,
      primary: '#0F7D73',
      secondary: '#0A2420',
      accent: '#7FD9CE',
      background: '#F0FAF8',
      border: '#D4EBE7',
      foreground: '#112A26',
      muted: '#4E706B',
    },
  },

  // ---- Blues --------------------------------------------------------------
  {
    name: 'Ocean Blue',
    family: 'Blue',
    description: 'The classic property blue — safe and credible',
    values: {
      ...DEFAULT_THEME,
      primary: '#1565C0',
      secondary: '#0C1E33',
      accent: '#90C2F5',
      background: '#F2F7FD',
      border: '#D9E6F5',
      foreground: '#13202E',
      muted: '#55697E',
    },
  },
  {
    name: 'Midnight Navy',
    family: 'Blue',
    description: 'Corporate and premium, strong on photography',
    values: {
      ...DEFAULT_THEME,
      primary: '#1E3A8A',
      secondary: '#0A1428',
      accent: '#A3C0F7',
      background: '#F4F6FB',
      border: '#DDE3EF',
      foreground: '#141D2E',
      muted: '#58667E',
    },
  },
  {
    name: 'Azure Sky',
    family: 'Blue',
    description: 'Bright and open — the airiest of the blues',
    values: {
      ...DEFAULT_THEME,
      primary: '#0369A1',
      secondary: '#082F49',
      accent: '#8BD6FA',
      background: '#F0F9FF',
      border: '#D3EAF8',
      foreground: '#0C2534',
      muted: '#4D6979',
    },
  },

  // ---- Reds ---------------------------------------------------------------
  {
    name: 'Terracotta',
    family: 'Red',
    description: 'Warm clay — architectural, the easiest red to live with',
    values: {
      ...DEFAULT_THEME,
      primary: '#B2452E',
      secondary: '#2B1510',
      accent: '#F0B49E',
      background: '#FDF6F3',
      border: '#F2DFD7',
      foreground: '#2E1A14',
      muted: '#79594F',
    },
  },
  {
    name: 'Crimson Luxe',
    family: 'Red',
    description: 'Bold wine red for a confident, high-end brand',
    values: {
      ...DEFAULT_THEME,
      primary: '#AF1B3F',
      secondary: '#27060F',
      accent: '#F3A9BC',
      background: '#FEF5F7',
      border: '#F6DCE3',
      foreground: '#2A1218',
      muted: '#7C5560',
    },
  },
  {
    name: 'Brick & Sand',
    family: 'Red',
    description: 'Muted brick on a sandy neutral — understated warmth',
    values: {
      ...DEFAULT_THEME,
      primary: '#9E3B2E',
      secondary: '#2A1A15',
      accent: '#E8B9A6',
      background: '#FAF7F4',
      border: '#EBE1D9',
      foreground: '#2B1D18',
      muted: '#766057',
    },
  },

  // ---- Warm & neutral -----------------------------------------------------
  {
    name: 'Royal Plum',
    family: 'Other',
    description: 'Purple — distinctive, differentiates from every rival',
    values: {
      ...DEFAULT_THEME,
      primary: '#6B2D8E',
      secondary: '#1E0F28',
      accent: '#D4A9E8',
      background: '#FAF5FD',
      border: '#EBDCF3',
      foreground: '#23132C',
      muted: '#6B5A76',
    },
  },
  {
    name: 'Graphite',
    family: 'Other',
    description: 'Monochrome — lets the property photography carry all colour',
    values: {
      ...DEFAULT_THEME,
      primary: '#3F4A5A',
      secondary: '#11161D',
      accent: '#C3CCD8',
      background: '#F6F7F9',
      border: '#E3E6EB',
      foreground: '#151A21',
      muted: '#5D6877',
    },
  },
  {
    name: 'Classic Gold',
    family: 'Other',
    description: 'Restores the previous PropFinova brand',
    // Kept at the real brand hex rather than a darkened lookalike, so this is
    // a faithful revert. #C9A227 is only ~2.3:1 against white, so the panel
    // will flag the button/link contrast — that is accurate, not a bug.
    accessible: false,
    values: {
      ...DEFAULT_THEME,
      primary: '#C9A227',
      secondary: '#0B0F19',
      accent: '#F4C97C',
      background: '#F7F4EC',
      border: '#E1D9C8',
      foreground: '#1B1B1B',
      muted: '#6A5C52',
    },
  },
];

/** Families in the order the settings picker should show them. */
export const PRESET_FAMILIES = ['Green', 'Blue', 'Red', 'Other'];
