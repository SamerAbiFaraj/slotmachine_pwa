import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RouletteWheel } from './RouletteWheel';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { GamePhase } from '../types';

interface WheelDrawerProps {
    isOpen: boolean;
    onToggle: () => void;
    gamePhase: GamePhase;
    winningNumber: string | null;
    timeLeft: number;
}

export const WheelDrawer: React.FC<WheelDrawerProps> = ({
    isOpen,
    onToggle,
    gamePhase,
    winningNumber,
    timeLeft
}) => {
    return (
        <>
            <AnimatePresence>
                {/* Backdrop Layer - More transparent */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[190]"
                    />
                )}
            </AnimatePresence>

            {/* Drawer Container - More transparent background */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-[100dvh] w-full md:w-[70vw] bg-neo-bg/70 backdrop-blur-lg z-[200] shadow-2xl border-r border-neo-gold/20 flex flex-col"
            >
                {/* Close Button / Handle inside drawer */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className="absolute top-4 left-4 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white flex items-center gap-2 group cursor-pointer z-[210] pointer-events-auto shadow-lg border border-white/20"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-xs uppercase tracking-widest font-bold">Close</span>
                </button>

                {/* Wheel Content */}
                <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                    {/* Background Glow - More subtle */}
                    <div className="absolute inset-0 bg-radial-gradient from-neo-green/5 to-transparent opacity-30 pointer-events-none" />

                    <div className="relative w-full aspect-square max-h-[60vh] md:max-h-[75vh] flex items-center justify-center">
                        <RouletteWheel phase={gamePhase} winningNumber={winningNumber} />
                    </div>
                </div>

                {/* Game Phase Indicator / Status Text inside Drawer */}
                <div className="p-6 text-center border-t border-white/10 bg-black/30 backdrop-blur-md">
                    <div className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-1">
                        {gamePhase === GamePhase.SPINNING ? 'SPINNING...' :
                            gamePhase === GamePhase.WAITING_FOR_BETS ? 'PLACE BETS' :
                                gamePhase.replace(/_/g, ' ')}
                    </div>
                    {/* Countdown Timer for betting or other phases */}
                    {(gamePhase === GamePhase.WAITING_FOR_BETS && timeLeft > 0) && (
                        <div className="text-4xl font-black text-white font-variant-numeric tabular-nums">
                            {timeLeft}s
                        </div>
                    )}
                    {(winningNumber && gamePhase === GamePhase.RESULT_DISPLAY) && (
                        <div className="text-2xl font-black text-white animate-pulse">
                            Winner: <span className="text-neo-red">{winningNumber}</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Toggle Handle (Visible when closed) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={onToggle}
                        className="fixed top-1/2 -translate-y-1/2 left-0 z-40 
                       bg-neo-bg/80 backdrop-blur-md border border-l-0 border-neo-gold/30
                       rounded-r-xl py-8 px-1 shadow-lg hover:bg-neo-bg hover:pr-3 transition-all group"
                        aria-label="Open Roulette Wheel"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-neo-gold/50 group-hover:bg-neo-gold transition-colors" />
                            <ChevronRight size={16} className="text-yellow-500" />
                            <div className="w-1 h-8 rounded-full bg-neo-gold/50 group-hover:bg-neo-gold transition-colors" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};