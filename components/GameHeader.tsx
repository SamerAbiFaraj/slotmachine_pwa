// GameHeader.tsx - ENLARGED VERSION

import React from 'react';
import { UserProfile, UserStats, GamePhase } from '../types';
import { Timer } from './Timer';
import { GAME_CONFIG } from '../constants-orginal';

interface Props {
    user: UserProfile;
    stats: UserStats;
    balance: number;
    phase: GamePhase;
    timeLeft: number;
}

export const GameHeader: React.FC<Props> = ({ user, stats, balance, phase, timeLeft }) => {
    const isProfit = stats.netProfit >= 0;

    return (
        <header className="
            w-full px-4 md:px-6 lg:px-8
            flex items-center justify-between 
            z-50 shrink-0 
            border-b border-white/5 
            bg-neo-bg/80 backdrop-blur-md landscape:bg-neo-bg landscape:backdrop-blur-none
            pt-[env(safe-area-inset-top)]
        " style={{ minHeight: 'var(--header-height)' }}>

            {/* Brand - LARGER */}
            <div className="flex items-center gap-3 md:gap-4 landscape:gap-2">
                <div className="
                    w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 landscape:w-7 landscape:h-7
                    rounded-lg md:rounded-xl landscape:rounded-md
                    bg-gradient-to-br from-neo-gold to-neo-goldDim 
                    flex items-center justify-center 
                    shadow-[0_0_20px_rgba(226,182,89,0.3)]
                ">
                    <span className="font-display font-bold text-black text-lg md:text-2xl lg:text-3xl landscape:text-sm">R</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-lg md:text-xl lg:text-2xl landscape:text-sm tracking-widest text-white leading-none">ROYALE</span>
                    <div className="flex items-center gap-2 landscape:hidden">
                        <span className="text-[9px] md:text-[10px] lg:text-xs text-neo-gold uppercase tracking-[0.3em]">Neo Glass</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                </div>
            </div>

            {/* Game Status - LARGER */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 landscape:gap-2">
                {phase === GamePhase.WAITING_FOR_BETS ? (
                    <div className="
                        glass-panel 
                        px-4 md:px-6 lg:px-8 landscape:px-4
                        py-2 md:py-2.5 lg:py-3 landscape:py-1
                        rounded-full 
                        flex items-center gap-2 md:gap-3 lg:gap-4 landscape:gap-2
                        border-neo-accent/30
                    ">
                        <Timer timeLeft={timeLeft} totalTime={GAME_CONFIG.BETTING_DURATION_SEC} />
                        <span className="
                            text-xs md:text-sm lg:text-base landscape:text-[10px]
                            text-neo-accent font-bold uppercase tracking-widest 
                            hidden sm:inline
                        ">
                            Place Bets
                        </span>
                    </div>
                ) : (
                    <div className="
                        glass-panel 
                        px-4 md:px-6 lg:px-8 landscape:px-4
                        py-2 md:py-2.5 lg:py-3 landscape:py-1
                        rounded-full 
                        border-red-500/30 
                        flex items-center gap-2 md:gap-3 landscape:gap-2
                    ">
                        <span className="w-2 md:w-2.5 lg:w-3 h-2 md:h-2.5 lg:h-3 landscape:w-1.5 landscape:h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="
                            text-red-400 
                            text-xs md:text-sm lg:text-base landscape:text-[10px]
                            font-bold uppercase tracking-widest
                        ">
                            {phase === GamePhase.SPINNING ? 'Locked' : 'Resolving'}
                        </span>
                    </div>
                )}
            </div>

            {/* User Status - LARGER */}
            <div className="flex items-center gap-3 md:gap-4 landscape:gap-2">
                {/* Balance */}
                <div className="
                    glass-panel 
                    px-4 md:px-5 lg:px-6 landscape:px-3
                    py-2 md:py-2.5 lg:py-3 landscape:py-1
                    rounded-full 
                    flex flex-col items-end 
                    border-neo-gold/20 
                    shadow-[0_5px_15px_rgba(0,0,0,0.3)]
                ">
                    <span className="
                        text-[8px] md:text-[9px] lg:text-[10px] landscape:hidden
                        text-gray-400 uppercase tracking-widest font-bold
                    ">
                        Balance
                    </span>
                    <span className="
                        font-display font-bold 
                        text-sm md:text-lg lg:text-2xl landscape:text-xs
                        text-neo-gold drop-shadow-sm
                    ">
                        ${balance.toLocaleString()}
                    </span>
                </div>

                {/* Avatar - LARGER */}
                <div className="
                    w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 landscape:w-8 landscape:h-8
                    rounded-full border-2 border-white/10 p-0.5 shrink-0
                ">
                    <div className="
                        w-full h-full rounded-full 
                        bg-gradient-to-tr from-slate-700 to-slate-600 
                        flex items-center justify-center 
                        font-bold text-sm md:text-base lg:text-lg landscape:text-xs text-white
                    ">
                        {user.username.charAt(0)}
                    </div>
                </div>
            </div>

        </header>
    );
};