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
                'tilt-shake': 'tilt-shake 0.3s ease-in-out infinite',
                'confetti': 'confetti-fall 3s linear infinite',
                'shine': 'shine 2s linear infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float-slow': 'float-slow 4s ease-in-out infinite',
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
                },
                'tilt-shake': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(5deg)' },
                    '50%': { transform: 'rotate(-5deg)' },
                    '75%': { transform: 'rotate(5deg)' },
                },
                'confetti-fall': {
                    '0%': { transform: 'translateY(-100vh) rotate(0deg) translateX(0)', opacity: 1 },
                    '25%': { transform: 'translateY(25vh) rotate(180deg) translateX(20px)' },
                    '50%': { transform: 'translateY(50vh) rotate(360deg) translateX(-20px)' },
                    '75%': { transform: 'translateY(75vh) rotate(540deg) translateX(20px)' },
                    '100%': { transform: 'translateY(100vh) rotate(720deg) translateX(0)', opacity: 0 },
                },
                'shine': {
                    '0%': { 'background-position': '-200% center' },
                    '100%': { 'background-position': '200% center' },
                },
                'glow-pulse': {
                    '0%, 100%': { opacity: 0.3, scale: 1 },
                    '50%': { opacity: 0.6, scale: 1.2 },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '33%': { transform: 'translate(10px, -10px)' },
                    '66%': { transform: 'translate(-10px, 5px)' },
                }
            },
            backgroundImage: {
                'noise': "url('https://www.transparenttextures.com/patterns/stardust.png')",
            }
        }
    },
    plugins: [],
}
