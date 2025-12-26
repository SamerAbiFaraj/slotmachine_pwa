import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinAnnouncementProps {
    winningNumber: string | null;
    isOpen: boolean;
    gamePhase: import('../types').GamePhase;
}

export const WinAnnouncement: React.FC<WinAnnouncementProps> = ({ winningNumber, isOpen, gamePhase }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (winningNumber && isOpen && gamePhase === 'RESULT_DISPLAY') {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 4000); // Hide after 4s (sync with phase change)
            return () => clearTimeout(timer);
        } else if (gamePhase !== 'RESULT_DISPLAY') {
            setShow(false);
        }
    }, [winningNumber, isOpen, gamePhase]);

    return (
        <AnimatePresence>
            {show && winningNumber && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none">
                    {/* Background Dim - Optional, might not be needed if existing dim is enough */}

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="relative"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-neo-gold/40 blur-[60px] rounded-full scale-150 animate-pulse" />

                        {/* Main Number Card */}
                        <div className="
                relative 
                w-48 h-48 md:w-64 md:h-64 rounded-xl 
                bg-gradient-to-br from-black/90 to-neo-bg/90 
                border-4 border-neo-gold
                flex flex-col items-center justify-center
                shadow-[0_0_50px_rgba(251,191,36,0.5)]
                backdrop-blur-xl
             ">
                            <div className="text-neo-gold font-bold uppercase tracking-widest mb-2 text-sm md:text-lg">
                                Winner
                            </div>
                            <div className={`
                    text-8xl md:text-9xl font-black 
                    ${['1', '3', '5', '7', '9', '12', '14', '16', '18', '19', '21', '23', '25', '27', '30', '32', '34', '36'].includes(winningNumber) ? 'text-neo-red' :
                                    winningNumber === '0' || winningNumber === '00' ? 'text-neo-green' : 'text-white'}
                    drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]
                 `}>
                                {winningNumber}
                            </div>
                        </div>

                        {/* Particles (Simple CSS/SVG Implementation) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                                    animate={{
                                        opacity: 0,
                                        x: (Math.random() - 0.5) * 400,
                                        y: (Math.random() - 0.5) * 400,
                                        scale: Math.random() + 0.5,
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="absolute w-4 h-4 bg-neo-gold rounded-full shadow-[0_0_10px_gold]"
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
