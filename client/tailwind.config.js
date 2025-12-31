module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        breeze: {
          blue: '#1e40af',
          lightBlue: '#3b82f6',
          gray: '#6b7280',
          lightGray: '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
};
