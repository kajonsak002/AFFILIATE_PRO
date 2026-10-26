/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        tiktokPink: "#fe2c55",
        tiktokCyan: "#25f4ee"
      }
    }
  },
  plugins: []
};
