import React, { useEffect, useRef } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { LeaderboardPanel } from './LeaderboardPanel';
import { LeaderboardEntry } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    history: string[];
    leaderboard: LeaderboardEntry[];
    currentRoundId: string;
}

// Helper to determine color (could be imported but duplicating for speed/independence)
const getNumberColor = (num: string) => {
    if (num === '0' || num === '00') return 'green';
    const n = parseInt(num);
    // Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)) return 'red';
    return 'black';
};

export const SlideOutPanel: React.FC<Props> = ({ isOpen, onClose, history, leaderboard, currentRoundId }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // --- Hot & Cold Analysis ---
    // Count frequencies in the last 50-100 spins (using full history prop)
    const frequencyMap = history.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Sort entries
    const sortedNumbers = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1]);

    // Last 50 spins usually
    // Hot: Top 3
    // Cold: Bottom 3 (of the ones that have appeared? Or checking all numbers? 
    // Usually "Cold" means "Hasn't appeared in a while" OR "Lowest frequency in current set")
    // Simple approach: Lowest frequency in current history set.
    const hotNumbers = sortedNumbers.slice(0, 4);
    const coldNumbers = sortedNumbers.slice(-4).reverse();

    // Helper render for stat balls
    const renderStatBall = (num: string, freq: number, type: 'hot' | 'cold') => {
        const color = getNumberColor(num);
        let bgClass = 'bg-gray-800';
        if (color === 'red') bgClass = 'bg-red-600';
        else if (color === 'black') bgClass = 'bg-gray-900';
        else if (color === 'green') bgClass = 'bg-green-600';

        return (
            <div key={num} className="flex flex-col items-center gap-1">
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center 
                    text-xs font-bold text-white shadow-lg border border-white/10
                    ${bgClass}
                    ${type === 'hot' ? 'ring-2 ring-orange-500/50' : 'ring-2 ring-blue-500/50'}
                `}>
                    {num}
                </div>
                <span className={`text-[10px] font-mono ${type === 'hot' ? 'text-orange-400' : 'text-blue-400'}`}>
                    {freq}x
                </span>
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-200
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`
                    fixed top-0 right-0 bottom-0 z-[70]
                    w-[320px] max-w-[90vw]
                    bg-neo-bg/95 backdrop-blur-xl
                    border-l border-neo-gold/20
                    shadow-[-10px_0_30px_rgba(0,0,0,0.5)]
                    transform transition-transform duration-300 ease-out
                    flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded-full bg-neo-gold"></span>
                        <h2 className="font-display font-bold text-lg text-white tracking-widest uppercase">Game Stats</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                    {/* Hot & Cold Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hot & Cold</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {/* HOT */}
                            <div className="glass-panel p-3 rounded-xl bg-gradient-to-br from-orange-900/20 to-transparent border-orange-500/20">
                                <div className="flex items-center gap-1 mb-2 text-orange-400 text-xs font-bold uppercase">
                                    <span>🔥 Hot</span>
                                </div>
                                <div className="flex justify-between">
                                    {hotNumbers.length > 0 ? hotNumbers.map(([num, freq]) => renderStatBall(num, freq, 'hot')) : <span className="text-xs text-white/30">No data</span>}
                                </div>
                            </div>

                            {/* COLD */}
                            <div className="glass-panel p-3 rounded-xl bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20">
                                <div className="flex items-center gap-1 mb-2 text-blue-400 text-xs font-bold uppercase">
                                    <span>❄️ Cold</span>
                                </div>
                                <div className="flex justify-between">
                                    {coldNumbers.length > 0 ? coldNumbers.map(([num, freq]) => renderStatBall(num, freq, 'cold')) : <span className="text-xs text-white/30">No data</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Spins</span>
                            <span className="text-[10px] text-yellow-500 bg-neo-gold/10 px-2 py-0.5 rounded-full border border-neo-gold/20">Last 20</span>
                        </div>
                        <div className="glass-panel p-4 rounded-xl">
                            <HistoryPanel history={history.slice(0, 20)} />
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Activity</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        </div>
                        <div className="glass-panel rounded-xl overflow-hidden min-h-[200px]">
                            <LeaderboardPanel entries={leaderboard} currentRoundId={currentRoundId} />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};
