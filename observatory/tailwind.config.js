/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#05070f',
          deep: '#070b18',
          abyss: '#0a1020',
        },
        panel: {
          DEFAULT: '#0c1326',
          raised: '#111a33',
          edge: '#1c2947',
        },
        aurora: {
          DEFAULT: '#7c5cff',
          soft: '#a78bfa',
          deep: '#4c2fd6',
        },
        pulse: {
          DEFAULT: '#22d3ee',
          soft: '#67e8f9',
          deep: '#0891b2',
        },
        signal: '#4ade80',
        flare: '#fbbf24',
        alert: '#f87171',
        star: {
          DEFAULT: '#e7ecff',
          muted: '#93a2c9',
          faint: '#5b6a92',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124, 92, 255, 0.28), 0 18px 60px -24px rgba(124, 92, 255, 0.55)',
        pulse: '0 0 0 1px rgba(34, 211, 238, 0.25), 0 18px 60px -24px rgba(34, 211, 238, 0.5)',
        inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
      },
      backgroundImage: {
        'aurora-sheen':
          'linear-gradient(135deg, rgba(124,92,255,0.18) 0%, rgba(34,211,238,0.12) 45%, rgba(5,7,15,0) 100%)',
        'panel-grid':
          'linear-gradient(rgba(124,92,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(34,211,238,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scan-sweep': 'scan-sweep 2.4s linear infinite',
        drift: 'drift 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
