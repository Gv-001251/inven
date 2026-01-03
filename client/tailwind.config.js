module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        breeze: {
          blue: '#1e40af', // Retaining for legacy compatibility if needed
          lightBlue: '#3b82f6',
          gray: '#6b7280',
          lightGray: '#f3f4f6',
        },
        // New Green Theme Palette
        primary: {
          DEFAULT: '#0C3834', // Deep Green / Sidebar
          light: '#2D5F5A',
          dark: '#05221F'
        },
        mint: {
          DEFAULT: '#F0FDF8', // Main Background
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7'
        },
        emerald: {
          custom: '#10B981', // Accents
          dim: '#34D399'
        }
      }
    },
  },
  plugins: [],
};
