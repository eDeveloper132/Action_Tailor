/**
 * Action Tailor - Tailwind CSS Configuration
 * Centralized bright theme colors and fonts for Tailwind CDN
 */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          surface: {
            DEFAULT: '#ffffff',
            hover: '#f8fafc',
            muted: '#f1f5f9',
          },
          border: '#e2e8f0',
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
          urdu: ['Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Segoe UI', 'system-ui', 'sans-serif'],
        },
      },
    },
  };
}


