/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                display: ['Rajdhani', 'sans-serif'],
            },
            colors: {
                neo: {
                    bg: '#020617', // Slate 950
                    glass: 'rgba(255, 255, 255, 0.05)',
                    border: 'rgba(255, 255, 255, 0.1)',
                    gold: '#E2B659',
                    goldDim: '#856626',
                    accent: '#0EA5E9', // Sky 500
                    felt: '#032F26', // Deep Teal
                }
            },
            aspectRatio: {
                'roulette-cell': '3 / 4',
            },
            animation: {
                'bounce-short': 'bounceShort 0.3s ease-out 1',
                'pulse-slow': 'pulseSlow 3s infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                bounceShort: {
                    '0%': { transform: 'translateY(-20px) scale(1.1)', opacity: 0 },
                    '60%': { transform: 'translateY(5px) scale(0.9)', opacity: 1 },
                    '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
                },
                pulseSlow: {
                    '0%, 100%': { opacity: 0.6 },
                    '50%': { opacity: 1 },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
            backgroundImage: {
                'noise': "url('https://www.transparenttextures.com/patterns/stardust.png')",
            }
        }
    },
    plugins: [],
}
