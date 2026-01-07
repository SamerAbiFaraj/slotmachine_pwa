import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Coins } from 'lucide-react';
import { audioManager } from '../utils/AudioManager';

interface Props {
    onComplete: (reward: number) => void;
    onClose: () => void;
}

const SEGMENTS = [
    { label: '$1,000', value: 1000, color: '#ef4444' }, // Red
    { label: '$500', value: 500, color: '#1f2937' },   // Black
    { label: '$5,000', value: 5000, color: '#eab308' }, // Gold
    { label: '$250', value: 250, color: '#ef4444' },    // Red
    { label: '$2,000', value: 2000, color: '#1f2937' }, // Black
    { label: '$10,000', value: 10000, color: '#eab308' },// Gold
    { label: '$100', value: 100, color: '#ef4444' },    // Red
    { label: '$750', value: 750, color: '#1f2937' },    // Black
];

export const DailyBonusWheel: React.FC<Props> = ({ onComplete, onClose }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<number | null>(null);
    const [rotation, setRotation] = useState(0);
    const wheelRef = useRef<HTMLDivElement>(null);

    const spinWheel = () => {
        if (isSpinning) return;
        setIsSpinning(true);

        if (audioManager.isReady) {
            audioManager.playSpin();
        }

        const segmentCount = SEGMENTS.length;
        const segmentAngle = 360 / segmentCount;
        const randomIndex = Math.floor(Math.random() * segmentCount);

        const extraSpins = 5 + Math.floor(Math.random() * 3);
        const randomOffset = Math.random() * (segmentAngle - 4) + 2;

        const targetRotation = rotation + (360 * extraSpins) + (360 - (randomIndex * segmentAngle));

        setRotation(targetRotation);

        setTimeout(() => {
            const wonAmount = SEGMENTS[randomIndex].value;
            setResult(wonAmount);

            if (audioManager.isReady) {
                audioManager.playWinSound();
            }

            setTimeout(() => {
                onComplete(wonAmount);
            }, 1000);

        }, 5000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 backdrop-blur-md"
            >
                <div className="min-h-full flex items-center justify-center p-4">
                    <div className="relative flex flex-col items-center w-full max-w-2xl py-8">

                        {/* Header */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-6 md:mb-8 text-center"
                        >
                            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_10px_rgba(234,179,8,0.5)]">
                                DAILY BONUS
                            </h2>
                            <p className="text-white/80 font-display tracking-widest mt-2 uppercase text-xs md:text-sm">
                                Spin to win free chips!
                            </p>
                        </motion.div>

                        {/* Wheel Container */}
                        <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px] flex-shrink-0">

                            {/* Pointer */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
                                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[30px] border-t-white border-r-[15px] border-r-transparent drop-shadow-lg" />
                            </div>

                            {/* The Wheel */}
                            <div
                                className="w-full h-full rounded-full border-4 border-neo-gold/50 shadow-[0_0_50px_rgba(234,179,8,0.4)] relative overflow-hidden bg-black"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transition: 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)'
                                }}
                            >
                                {SEGMENTS.map((seg, i) => {
                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-1/2 left-1/2 w-full h-[2px] origin-left"
                                        />
                                    );
                                })}

                                {/* SVG Implementation for Segments */}
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
                                    {SEGMENTS.map((seg, i) => {
                                        const count = SEGMENTS.length;
                                        const angle = 360 / count;
                                        const startAngle = i * angle;
                                        const endAngle = (i + 1) * angle;

                                        const startRad = (startAngle * Math.PI) / 180;
                                        const endRad = (endAngle * Math.PI) / 180;

                                        const x1 = 50 + 50 * Math.cos(startRad);
                                        const y1 = 50 + 50 * Math.sin(startRad);
                                        const x2 = 50 + 50 * Math.cos(endRad);
                                        const y2 = 50 + 50 * Math.sin(endRad);

                                        const pathD = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                                        return (
                                            <g key={i}>
                                                <path d={pathD} fill={seg.color} stroke="#fbbf24" strokeWidth="0.5" />
                                                <text
                                                    x="50"
                                                    y="50"
                                                    fill={seg.color === '#eab308' ? 'black' : 'white'}
                                                    fontSize="6"
                                                    fontWeight="bold"
                                                    fontFamily="Arial"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    transform={`rotate(${startAngle + angle / 2}, 50, 50) translate(25, 0) rotate(90, 0, 0)`}
                                                >
                                                    {seg.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Center Cap */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-10">
                                    <span className="text-xl">★</span>
                                </div>
                            </div>
                        </div>

                        {/* Result Pop-up or Spin Button */}
                        <div className="mt-8 md:mt-12 h-20 flex items-center justify-center">
                            {!result && !isSpinning && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={spinWheel}
                                    className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-lg md:text-xl tracking-wider uppercase rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400 whitespace-nowrap"
                                >
                                    SPIN NOW
                                </motion.button>
                            )}

                            {result && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-center"
                                >
                                    <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-4 whitespace-nowrap">
                                        YOU WON ${result.toLocaleString()}!
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 md:px-8 bg-neo-gold text-black font-bold uppercase rounded-full hover:bg-white transition-colors"
                                    >
                                        Claim & Play
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Close link (if they really want to skip) */}
                        {!isSpinning && !result && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
                            >
                                <X />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
