/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepBlue: "#395A7F",
        skyBlue: "#6E9FC1",
        accentBlue: "#A3CAE9",
        yellow: "#FFFF00",
        neutralGray: "#ACACAC",
        charcoal: "#333333",
        offWhite: "#F9FAFB",
      }
    },
  },
  plugins: [],
}