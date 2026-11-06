/**
 * Self-check for the theme token layer:  node src/lib/themeTokens.test.mjs
 *
 * Covers the two bits with real logic — normalizeTheme (what reaches the
 * <style> tag) and the contrast math (what warns the admin).
 */
import assert from 'node:assert/strict';
import {
  COLOR_TOKENS,
  DEFAULT_THEME,
  contrastRatio,
  contrastWarnings,
  fontStack,
  isFontKey,
  isHexColor,
  normalizeTheme,
  relativeLuminance,
  themeToCssVars,
  PRESET_FAMILIES,
  THEME_PRESETS,
} from './themeTokens.js';

// --- isHexColor -------------------------------------------------------------
assert.equal(isHexColor('#17855A'), true);
assert.equal(isHexColor('#17855a'), true);
assert.equal(isHexColor('17855A'), false, 'needs the leading #');
assert.equal(isHexColor('#FFF'), false, 'shorthand is not accepted');
assert.equal(isHexColor('#12345G'), false);
assert.equal(isHexColor(''), false);
assert.equal(isHexColor(null), false);
assert.equal(isHexColor('red; } body { display:none'), false, 'no CSS injection');

// --- normalizeTheme ---------------------------------------------------------
// An empty input must still yield a complete, valid theme.
const blank = normalizeTheme(null);
for (const token of COLOR_TOKENS) {
  assert.equal(blank[token.key], token.default, `${token.key} falls back to default`);
}
assert.equal(blank.fontBody, 'jakarta');
assert.equal(blank.fontHeading, 'fraunces');

// A legacy 2-colour document gets filled out rather than leaving holes.
const legacy = normalizeTheme({ primary: '#C9A227', secondary: '#0B0F19' });
assert.equal(legacy.primary, '#C9A227');
assert.equal(legacy.background, DEFAULT_THEME.background, 'missing token backfilled');

// Junk is dropped, not passed through to the <style> tag.
const hostile = normalizeTheme({
  primary: 'red; } html { display: none } :root { x:',
  muted: '#abc',
  fontBody: '../../etc/passwd',
});
assert.equal(hostile.primary, DEFAULT_THEME.primary, 'injection rejected');
assert.equal(hostile.muted, DEFAULT_THEME.muted, 'shorthand hex rejected');
assert.equal(hostile.fontBody, 'jakarta', 'unknown font key rejected');

// Hex is normalised to upper case so the colour input and stored value match.
assert.equal(normalizeTheme({ primary: '#17855a' }).primary, '#17855A');

// --- themeToCssVars --------------------------------------------------------
const css = themeToCssVars({ primary: '#17855A', fontHeading: 'playfair' });
assert.match(css, /^:root\{/);
assert.match(css, /--primary:#17855A/);
assert.match(css, /--btn-text:#FFFFFF/, 'camelCase key maps to its kebab CSS var');
assert.match(css, /--font-heading:var\(--font-playfair\)/);
// Nothing unvalidated can escape the declaration block.
assert.equal(themeToCssVars({ primary: '#fff; } *{display:none}' }).includes('display:none'), false);
assert.equal((css.match(/[{}]/g) || []).length, 2, 'exactly one balanced block');

// --- fonts -----------------------------------------------------------------
assert.equal(isFontKey('inter'), true);
assert.equal(isFontKey('comic-sans'), false);
assert.match(fontStack('inter'), /var\(--font-inter\)/);
assert.match(fontStack('nope', 'jakarta'), /var\(--font-jakarta\)/, 'falls back');

// --- contrast --------------------------------------------------------------
// Known anchors: white on black is the 21:1 maximum, identical colours are 1:1.
assert.equal(Math.round(contrastRatio('#FFFFFF', '#000000')), 21);
assert.equal(Math.round(contrastRatio('#777777', '#777777')), 1);
assert.ok(Math.abs(relativeLuminance('#FFFFFF') - 1) < 1e-9);
assert.ok(relativeLuminance('#000000') === 0);
// Ratio is symmetric — order of arguments must not matter.
assert.ok(
  Math.abs(contrastRatio('#17855A', '#FFFFFF') - contrastRatio('#FFFFFF', '#17855A')) < 1e-9
);

// The shipped default palette must itself be accessible.
assert.deepEqual(
  contrastWarnings(DEFAULT_THEME),
  [],
  'default light-green theme passes every AA check'
);

// Every preset must sit in a known family, or the settings picker silently
// drops it (it renders family by family).
for (const preset of THEME_PRESETS) {
  assert.ok(
    PRESET_FAMILIES.includes(preset.family),
    `preset "${preset.name}" has family "${preset.family}", not in PRESET_FAMILIES`
  );
  // A preset must override every colour token, otherwise the default green
  // leaks into a blue or red palette.
  for (const token of COLOR_TOKENS) {
    assert.ok(preset.values[token.key], `preset "${preset.name}" is missing ${token.key}`);
  }
}
assert.ok(THEME_PRESETS.length >= 12, 'preset library should stay broad');

// So must every preset, except the ones explicitly marked as a faithful
// restore of a brand that never passed (Classic Gold) — those must still be
// *detected* as failing rather than quietly shipped as fine.
for (const preset of THEME_PRESETS) {
  const warnings = contrastWarnings(preset.values);
  if (preset.accessible === false) {
    assert.ok(
      warnings.length > 0,
      `preset "${preset.name}" is marked inaccessible, so it must raise warnings`
    );
  } else {
    assert.deepEqual(warnings, [], `preset "${preset.name}" passes every AA check`);
  }
}

// The exact trap this guards against: a pale mint primary with white labels.
const pale = contrastWarnings({ ...DEFAULT_THEME, primary: '#D7F5DC' });
assert.ok(
  pale.some((w) => w.fg === 'btnText' && w.bg === 'primary'),
  'pale primary + white button text is flagged'
);

console.log('themeTokens: all checks passed');
