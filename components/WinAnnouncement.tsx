import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimalByNumber } from '../animalMapping';

interface WinAnnouncementProps {
    winningNumber: string | null;
    isOpen: boolean;
    gamePhase: import('../types').GamePhase;
    totalWin?: number;
    multiplier?: number;
}

export const WinAnnouncement: React.FC<WinAnnouncementProps> = ({ winningNumber, isOpen, gamePhase, totalWin = 0, multiplier }) => {
    const [show, setShow] = useState(false);
    const isWin = totalWin > 0;
    const isMultiplierWin = isWin && !!multiplier;
    const containerRef = useRef<HTMLDivElement>(null);

    // ✅ CLEAN EXIT: Ensure component unmounts properly
    useEffect(() => {
        if (winningNumber && isOpen && gamePhase === 'RESULT_DISPLAY') {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        } else {
            // ✅ Always hide when not in RESULT_DISPLAY
            setShow(false);
        }
    }, [winningNumber, isOpen, gamePhase]);

    // 3D Tilt Effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !isWin) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateY = ((x - centerX) / centerX) * 5; // Max 5deg tilt
        const rotateX = ((centerY - y) / centerY) * 5;

        containerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        if (containerRef.current) {
            containerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }
    };


    const particles = useMemo(() => {
        return [...Array(50)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 1.5,
            duration: 3 + Math.random() * 2,
            size: Math.random() * 6 + 4,
            color: isMultiplierWin ? [
                '#60a5fa', // Blue 400
                '#c084fc', // Purple 400
                '#e879f9', // Fuchsia 400
                '#ffffff', // White
                '#38bdf8'  // Sky 400
            ][Math.floor(Math.random() * 5)] : [
                '#FFD700', // Gold
                '#FDB931', // Yellow-Orange
                '#FFFFFF', // White Sparkle
                '#ef4444', // Red
                '#10b981', // Green
            ][Math.floor(Math.random() * 5)],
            shape: Math.random() > 0.5 ? 'square' : 'circle',
            isSparkle: Math.random() > 0.85
        }));
    }, [show, isMultiplierWin]); // 👈 recompute only when show changes

    const animalInfo = useMemo(() => winningNumber ? getAnimalByNumber(winningNumber) : null, [winningNumber]);

    return (
        <AnimatePresence>
            {show && winningNumber && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none overflow-hidden">
                    {/* Background Vignette */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.3 } }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* CONFETTI */}
                    {isWin && (
                        <div className="absolute inset-0 z-[301]">
                            {particles.map((p) => (
                                <div
                                    key={p.id}
                                    className={`absolute top-[-5vh] animate-confetti ${p.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
                                        }`}
                                    style={{
                                        left: p.left,
                                        width: `${p.size}px`,
                                        height: `${p.size}px`,
                                        backgroundColor: p.color,
                                        animationDelay: `${p.delay}s`,
                                        animationDuration: `${p.duration}s`,
                                        opacity: p.isSparkle ? 0.95 : 0.75,
                                        boxShadow: p.isSparkle ? `0 0 8px ${p.color}` : 'none',
                                        willChange: 'transform',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* WIN CARD WITH 3D TILT */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.2, opacity: 0, y: 20, transition: { duration: 0.3 } }}
                        transition={{ type: "spring", stiffness: 260, damping: 15 }}
                        className="relative flex flex-col items-center gap-[1vh] md:gap-4 z-[302] pointer-events-auto"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        ref={containerRef}
                        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s ease' }}
                    >
                        {/* Ambient Glows */}
                        <div className="absolute inset-0 -z-10">
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vh] h-[30vh] ${isMultiplierWin ? 'bg-purple-500/40' : 'bg-neo-gold/30'} rounded-full blur-[100px] animate-glow-pulse`} />
                            {isWin && (
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vh] h-[50vh] ${isMultiplierWin ? 'bg-blue-500/30' : 'bg-yellow-500/20'} rounded-full blur-[120px] animate-pulse`} />
                            )}
                        </div>

                        {/* BIG WIN / LIGHTNING WIN HEADER */}
                        {isWin && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="flex flex-col items-center mb-[-1vh] z-20"
                            >
                                <div className={`
                                    text-[6vh] md:text-7xl font-black italic tracking-tighter uppercase
                                    bg-gradient-to-b ${isMultiplierWin ? 'from-white via-blue-400 to-purple-600' : 'from-white via-neo-gold to-yellow-800'}
                                    bg-clip-text text-transparent
                                    drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)]
                                    relative
                                    text-center
                                `}>
                                    {isMultiplierWin ? 'Lightning Win!' : 'Big Win!'}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent background-size-[200%] animate-shine bg-clip-text pointer-events-none" />
                                </div>
                                {isMultiplierWin && (
                                    <div className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(147,51,234,0.8)] animate-bounce mt-2">
                                        ⚡ {multiplier}x ⚡
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Main Info Card */}
                        <div className="relative group p-[1.5vh]">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-[2px] border-dashed border-neo-gold/30 rounded-[3vh] scale-105"
                            />

                            <div className={`
                                relative 
                                w-[34vh] h-[34vh] max-w-[18rem] max-h-[18rem] rounded-[4vh]
                                bg-gradient-to-br from-[#1e293b] via-[#020617] to-[#020617]
                                border-[3px] ${isMultiplierWin ? 'border-purple-400/80' : 'border-neo-gold/60'}
                                flex flex-col items-center justify-center
                                shadow-[0_0_80px_rgba(226,182,89,0.4),inset_0_0_40px_rgba(0,0,0,0.8)]
                                backdrop-blur-2xl overflow-hidden
                                transform-style-3d
                            `}>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="flex flex-col items-center justify-center h-full w-full py-1 gap-[0.5vh]">
                                    {animalInfo && (
                                        <motion.img
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            src={animalInfo.imagePath}
                                            alt={animalInfo.animal}
                                            className="h-[8vh] max-h-16 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] flex-shrink-0"
                                        />
                                    )}
                                    <div className={`
                                        text-[10vh] md:text-[6rem] font-black font-display leading-[0.9] flex-shrink-0
                                        ${['1', '3', '5', '7', '9', '12', '14', '16', '18', '19', '21', '23', '25', '27', '30', '32', '34', '36'].includes(winningNumber) ? 'text-neo-red' :
                                            winningNumber === '0' || winningNumber === '00' ? 'text-neo-green' : 'text-white'}
                                        drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]
                                    `}>
                                        {winningNumber}
                                    </div>
                                    {animalInfo && (
                                        <div className="text-yellow-500 font-display font-black uppercase tracking-[0.2em] text-[2.2vh] md:text-sm text-center leading-tight flex-shrink-0">
                                            {animalInfo.animal}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* WIN AMOUNT DISPLAY */}
                        {isWin && (
                            <motion.div
                                initial={{ scale: 0, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                className="
                                    relative
                                    bg-gradient-to-r ${isMultiplierWin ? 'from-purple-600 via-blue-400 to-purple-600' : 'from-yellow-600 via-neo-gold to-yellow-600'}
                                    p-[2px] rounded-full
                                    shadow-[0_8px_20px_rgba(226,182,89,0.3)]
                                "
                            >
                                <div className="bg-[#020617] px-8 py-2 md:py-3 rounded-full flex flex-col items-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="text-yellow-500 text-[1vh] md:text-[10px] uppercase font-black tracking-[0.2em] mb-0.5">
                                        Total Payout
                                    </div>
                                    <div className="text-[3.5vh] md:text-4xl font-black text-white font-display flex items-center gap-1">
                                        <span className="text-yellow-500">$</span>
                                        {totalWin.toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};