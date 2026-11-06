import mongoose from 'mongoose';
import { COLOR_TOKENS, FONT_KEYS, DEFAULT_FONTS } from '@/lib/themeTokens';

// Singleton document — one theme for the whole site.
// Values land inside a <style> tag, so the hex format is enforced here too.
const HEX = /^#[0-9a-fA-F]{6}$/;

// One schema path per colour token, generated from the registry so the model
// can never fall out of sync with what the settings page offers.
const colorPaths = Object.fromEntries(
  COLOR_TOKENS.map((token) => [
    token.key,
    {
      type: String,
      trim: true,
      default: token.default,
      match: [HEX, `${token.label} must be a 6-digit hex like ${token.default}`],
    },
  ])
);

const themeSchema = new mongoose.Schema(
  {
    ...colorPaths,
    fontBody: {
      type: String,
      trim: true,
      default: DEFAULT_FONTS.fontBody,
      enum: FONT_KEYS,
    },
    fontHeading: {
      type: String,
      trim: true,
      default: DEFAULT_FONTS.fontHeading,
      enum: FONT_KEYS,
    },
  },
  { timestamps: true }
);

const Theme = mongoose.models.Theme || mongoose.model('Theme', themeSchema);

export { DEFAULT_THEME, isHexColor, normalizeTheme } from '@/lib/themeTokens';

export default Theme;
