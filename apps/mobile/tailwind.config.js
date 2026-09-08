/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F5F2",
        surface: "#FFFFFF",
        "surface-muted": "#E8EBE6",
        border: "#D8D5CC",
        ink: "#20231F",
        muted: "#4D544C",
        primary: "#283129",
        "primary-foreground": "#FFFFFF",
        sales: "#1F9D72",
        "sales-soft": "#E3F5EF",
        accent: "#B6532B",
        "accent-soft": "#FBE9E1",
        destructive: "#9B342A"
      },
      borderRadius: {
        card: "16px",
        control: "10px"
      }
    }
  },
  plugins: []
};
