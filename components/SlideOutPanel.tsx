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
