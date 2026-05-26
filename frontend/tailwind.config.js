/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ig: {
          bg: "#000000",
          surface: "#121212",
          elevated: "#1C1C1E",
          border: "#262626",
          text: "#F5F5F5",
          muted: "#A8A8A8",
          faint: "#6E6E6E",
          primary: "#0095F6",
          danger: "#ED4956",
          story1: "#F58529",
          story2: "#DD2A7B",
          story3: "#8134AF",
          story4: "#515BD4",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
}
