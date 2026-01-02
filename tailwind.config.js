/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                // Serif for numbers & labels (casino-style)
                roulette: ["Cinzel", "serif"],
                // Elegant serif for headings / table title
                display: ["Playfair Display", "serif"],
                // UI
                sans: ["Montserrat", "system-ui", "sans-serif"],
            },
            colors: {
                casino: {
                    // Authentic roulette scheme [web:26]
                    felt: "#01431E", // Traditional forest green
                    feltDark: "#012715",
                    red: "#E0080B", // KU Crimson
                    black: "#000000",
                    zero: "#016D29", // La Salle Green for 0/00 [web:26]
                    gold: "#F3C620", // Deep Lemon gold
                    wood: "#3C1912", // Dark Sienna “rail”
                    textLight: "#FFFDF5",
                    textMuted: "#C1B89A",
                    borderSoft: "rgba(255,255,255,0.18)",
                    borderStrong: "rgba(0,0,0,0.65)",
                    chipBlue: "#3182CE",
                    chipGreen: "#22C55E",
                    chipPurple: "#7C3AED",
                },
            },
            aspectRatio: {
                // American table layout is long and narrow [web:31]
                "roulette-table": "7 / 3",
                "roulette-cell": "3 / 4",
            },
            boxShadow: {
                "roulette-rail":
                    "0 18px 40px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)",
                "roulette-chip":
                    "0 4px 10px rgba(0,0,0,0.75), inset 0 0 0 2px rgba(255,255,255,0.55)",
            },
            borderRadius: {
                rail: "1.75rem",
                "rail-inner": "1.2rem",
                cell: "0.4rem",
                chip: "9999px",
            },
            animation: {
                "bounce-short": "bounceShort 0.3s ease-out 1",
                "pulse-slow": "pulseSlow 3s ease-in-out infinite",
                "float-slow": "float-slow 4s ease-in-out infinite",
                "wheel-spin": "wheelSpin 3s cubic-bezier(0.22, 0.61, 0.36, 1) infinite",
                "chip-drop": "chipDrop 220ms ease-out 1",
            },
            keyframes: {
                bounceShort: {
                    "0%": { transform: "translateY(-10px) scale(1.05)", opacity: "0" },
                    "70%": { transform: "translateY(3px) scale(0.97)", opacity: "1" },
                    "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
                },
                pulseSlow: {
                    "0%, 100%": { opacity: "0.7" },
                    "50%": { opacity: "1" },
                },
                "float-slow": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                wheelSpin: {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
                chipDrop: {
                    "0%": { transform: "translateY(-12px) scale(0.9)", opacity: "0" },
                    "60%": { transform: "translateY(2px) scale(1.02)", opacity: "1" },
                    "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
                },
            },
            backgroundImage: {
                "felt-noise":
                    "radial-gradient(circle at 0 0, rgba(255,255,255,0.06) 0, transparent 55%), radial-gradient(circle at 100% 100%, rgba(0,0,0,0.45) 0, transparent 60%)",
                "wood-grain":
                    "linear-gradient(135deg, #3C1912 0%, #5A2819 40%, #3C1912 100%)",
            },
            spacing: {
                // Gives you consistent rails around the table
                "table-rail": "1.25rem",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
