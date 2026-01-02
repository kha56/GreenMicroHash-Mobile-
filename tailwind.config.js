/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base colors
        'gmh-dark': '#0A0A0B',
        'gmh-dark-secondary': '#121214',
        'gmh-card': '#1A1A1D',
        'gmh-border': '#2A2A2E',
        // Primary accent - Electric Purple
        'gmh-purple': '#7C3AED',
        'gmh-purple-light': '#A78BFA',
        // Success - Lime Green
        'gmh-lime': '#84CC16',
        'gmh-lime-light': '#BEF264',
        // Warning - Amber
        'gmh-amber': '#F59E0B',
        // Error - Red
        'gmh-red': '#EF4444',
        // Info - Blue
        'gmh-blue': '#3B82F6',
        // Success - Green
        'gmh-green': '#10B981',
        // Muted
        'gmh-slate': '#64748B',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'heading': ['Space Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
