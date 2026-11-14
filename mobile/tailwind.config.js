/**
 * Palette copied from the web app's src/app/globals.css :root tokens
 * (soft light-green theme) so the app reads as the same brand.
 * Static snapshot by choice — web's theme is admin-editable via /api/theme,
 * app does not fetch it live.
 */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#17855a",
          dark: "#0f5a3d",
          darker: "#0a3d2a",
          light: "#6fcf9a",
          soft: "#e8f7ef",
        },
        secondary: {
          DEFAULT: "#10251b",
          dark: "#0a1812",
          light: "#1c3a2b",
        },
        accent: {
          DEFAULT: "#6fcf9a",
          soft: "#dcf3e6",
        },
        background: "#f3faf6",
        surface: "#ffffff",
        border: "#dceae2",
        foreground: "#16241d",
        muted: "#5c7268",
      },
    },
  },
  plugins: [],
};
