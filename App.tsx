import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, BetType, PlacedBet, UserProfile, UserStats, LeaderboardEntry, QuantumMultiplier } from './types';
import { AVAILABLE_CHIPS, GAME_CONFIG } from './constants';
import { WheelDrawer } from './components/WheelDrawer';
import { BettingTable } from './components/BettingTable';
import { GameControls } from './components/GameControls';
import { HistoryPanel } from './components/HistoryPanel';
import { GameHeader } from './components/GameHeader';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { Racetrack } from './components/Racetrack';
import { OrientationOverlay } from './components/OrientationOverlay';
import { comms } from './services/communication';
import { simulation } from './services/simulation';
import { getAnimalImagePath, getAnimalName } from './animalMapping';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Coins, X } from 'lucide-react';

// ... (existing imports)

import { SlideOutPanel } from './components/SlideOutPanel';
import { InstallPrompt } from './components/InstallPrompt';
import { WinAnnouncement } from './components/WinAnnouncement';

// ✅ IMPORT CHIP MAPPING FOR USE IN GameControls
import { chipMapping } from './chipMapping';

const App: React.FC = () => {
    // --- Game State ---
    const [phase, setPhase] = useState<GamePhase>(GamePhase.WAITING_FOR_BETS);
    const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.BETTING_DURATION_SEC);
    const [winningNumber, setWinningNumber] = useState<string | null>(null);

    // --- User State ---
    const [user, setUser] = useState<UserProfile>({ userId: 'user_local_123', username: 'ProPlayer', currency: 'USD', vipLevel: 7 });
    const [balance, setBalance] = useState(25000);
    const [stats, setStats] = useState<UserStats>({ totalWagered: 0, totalWon: 0, netProfit: 0, startBalance: 25000 });

    // --- Round State ---
    const [currentBets, setCurrentBets] = useState<PlacedBet[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [selectedChip, setSelectedChip] = useState<number>(AVAILABLE_CHIPS[1].value);
    const [lastWin, setLastWin] = useState<number>(0);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // --- Pro Features State ---
    const [showRacetrack, setShowRacetrack] = useState(false);
    const [heatmapActive, setHeatmapActive] = useState(false);
    const [autoPlayActive, setAutoPlayActive] = useState(false);
    const [quantumMultipliers, setQuantumMultipliers] = useState<QuantumMultiplier[]>([]);
    const [highlightedNeighbors, setHighlightedNeighbors] = useState<string[]>([]);
    const [isStatsOpen, setIsStatsOpen] = useState(false); // Side Panel State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Wheel Drawer State
    const [isProfileOpen, setIsProfileOpen] = useState(false); // Mobile Top Drawer
    const [isChipsOpen, setIsChipsOpen] = useState(false); // Mobile Bottom Drawer

    // --- Refs ---
    const betsRef = useRef<PlacedBet[]>([]);
    const lastRoundIdRef = useRef<string>('');
    const lastBetsRef = useRef<PlacedBet[]>([]);

    useEffect(() => { betsRef.current = currentBets; }, [currentBets]);

    const totalBetAmount = currentBets.reduce((sum, bet) => sum + bet.amount, 0);

    // --- Initialization ---
    useEffect(() => {
        comms.sendMessage({
            type: 'IFRAME_READY',
            data: { iframeId: 'roulette_neo', dimensions: { width: window.innerWidth, height: window.innerHeight } }
        });

        simulation.startSimulation();

        const unsubState = simulation.subscribeState((newPhase, newTime, result, roundId, multipliers) => {
            setPhase(newPhase);
            setTimeLeft(newTime);

            if (multipliers) setQuantumMultipliers(multipliers);

            if (roundId && roundId !== lastRoundIdRef.current) {
                if (autoPlayActive && lastBetsRef.current.length > 0) {
                    const rebetCost = lastBetsRef.current.reduce((s, b) => s + b.amount, 0);
                    if (balance >= rebetCost) {
                        setCurrentBets(lastBetsRef.current.map(b => ({ ...b, id: Math.random().toString() })));
                        setBalance(prev => prev - rebetCost);
                        setNotification({ msg: "Autoplay: Bets Placed", type: 'info' });
                    } else {
                        setAutoPlayActive(false);
                        setCurrentBets([]);
                    }
                } else {
                    setCurrentBets([]);
                }

                setWinningNumber(null);
                setLastWin(0);
                setLeaderboard([]);
                setQuantumMultipliers([]);
                lastRoundIdRef.current = roundId;
            }

            if (newPhase === GamePhase.SPINNING && result && winningNumber === null) {
                setWinningNumber(result);
            }

            if (newPhase === GamePhase.RESULT_DISPLAY && result) {
                if (lastWin === 0 && betsRef.current.length >= 0) {
                    handleRoundResult(result, betsRef.current);
                    if (betsRef.current.length > 0) lastBetsRef.current = [...betsRef.current];
                }
            }
        });

        const unsubLeaderboard = simulation.subscribeLeaderboard(setLeaderboard);
        return () => { unsubState(); unsubLeaderboard(); };
    }, [autoPlayActive]);

    // --- Drawer Logic ---
    useEffect(() => {
        if (phase === GamePhase.SPINNING || phase === GamePhase.RESULT_DISPLAY) {
            setIsDrawerOpen(true);
        } else if (phase === GamePhase.WAITING_FOR_BETS) {
            // Optional: Add a small delay so user sees result before closing
            const timer = setTimeout(() => setIsDrawerOpen(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    const handlePlaceBet = useCallback((type: BetType, numbers: string[], payoutRatio: number) => {
        if (balance - totalBetAmount < selectedChip) {
            setNotification({ msg: "Insufficient Balance", type: 'error' });
            setTimeout(() => setNotification(null), 2000);
            return;
        }

        const newBet: PlacedBet = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            numbers,
            amount: selectedChip,
            chipValue: selectedChip,
            payoutRatio,
            status: 'pending'
        };

        setCurrentBets(prev => [...prev, newBet]);
        setBalance(prev => prev - selectedChip);

    }, [balance, totalBetAmount, selectedChip]);

    const handleUndo = () => {
        if (currentBets.length === 0) return;
        const lastBet = currentBets[currentBets.length - 1];
        setBalance(prev => prev + lastBet.amount);
        setCurrentBets(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        const totalRefund = currentBets.reduce((acc, bet) => acc + bet.amount, 0);
        setBalance(prev => prev + totalRefund);
        setCurrentBets([]);
    };

    const handleSaveLayout = () => {
        if (currentBets.length === 0) return;
        localStorage.setItem('saved_layout', JSON.stringify(currentBets));
        setNotification({ msg: "Configuration Saved", type: 'success' });
        setTimeout(() => setNotification(null), 2000);
    };

    const handleLoadLayout = () => {
        const saved = localStorage.getItem('saved_layout');
        if (saved) {
            const bets = JSON.parse(saved) as PlacedBet[];
            const cost = bets.reduce((s, b) => s + b.amount, 0);
            if (balance >= cost) {
                setCurrentBets(bets.map(b => ({ ...b, id: Math.random().toString() })));
                setBalance(prev => prev - cost);
                setNotification({ msg: "Bets Loaded", type: 'success' });
            } else {
                setNotification({ msg: "Insufficient Funds", type: 'error' });
            }
            setTimeout(() => setNotification(null), 2000);
        }
    };

    const handleRoundResult = (result: string, betsToProcess: PlacedBet[]) => {
        let totalWin = 0;
        const qMult = quantumMultipliers.find(q => q.number === result);

        betsToProcess.forEach(bet => {
            if (bet.numbers.includes(result)) {
                let payout = bet.payoutRatio;
                if (bet.type === BetType.STRAIGHT && qMult) {
                    payout = qMult.multiplier;
                }
                const win = (bet.amount * payout) + bet.amount;
                totalWin += win;
            }
        });

        const roundWager = betsToProcess.reduce((acc, b) => acc + b.amount, 0);

        setStats(prev => ({
            totalWagered: prev.totalWagered + roundWager,
            totalWon: prev.totalWon + totalWin,
            netProfit: (prev.totalWon + totalWin) - (prev.totalWagered + roundWager),
            startBalance: prev.startBalance
        }));

        setHistory(prev => [result, ...prev].slice(0, 50));
        setLastWin(totalWin);

        if (totalWin > 0) {
            setBalance(prev => prev + totalWin);
            setNotification({ msg: `WIN: $${totalWin.toLocaleString()}`, type: 'success' });
        } else {
            setNotification({ msg: `No Win - ${result}`, type: 'info' });
        }
        setTimeout(() => setNotification(null), 4000);
    };

    return (
        <div className="relative h-[100dvh] w-full bg-neo-bg font-sans text-gray-100 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-800 via-neo-bg to-black flex flex-col">
            <OrientationOverlay />

            <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none mix-blend-overlay z-10"></div>

            {/* SECTION 1: HEADER (Desktop Only) */}
            <header className="relative z-30 w-full shrink-0 hidden md:block">
                <GameHeader user={user} stats={stats} balance={balance} phase={phase} timeLeft={timeLeft} />
            </header>

            {/* MOBILE DROPDOWN TRIGGERS (Mobile Only) */}
            <div className="md:hidden fixed top-2 right-2 z-[60] flex gap-2">
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="p-2 bg-neo-bg/90 backdrop-blur-md rounded-full border border-neo-gold/30 shadow-lg"
                >
                    <User className="w-5 h-5 text-neo-gold" />
                </button>
            </div>

            {/* SECTION 2: MIDDLE (TABLE AREA) */}
            <main className={`
                relative flex-1 min-h-0 z-0 flex items-center justify-center 
                transition-all duration-700 ease-in-out overflow-hidden
                ${(isDrawerOpen || isProfileOpen || isChipsOpen) ? 'opacity-40 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}
            `}>
                <div className="w-full h-full flex items-center justify-center p-1">
                    <div className="relative w-full max-h-full max-w-[92vw] mx-auto flex items-center justify-center">
                        <div className="
                            w-full transition-transform duration-500
                            scale-100 md:scale-90 lg:scale-95
                            max-md:-translate-y-8
                        ">
                            {showRacetrack ? (
                                <Racetrack
                                    onBet={handlePlaceBet}
                                    onHoverNumbers={setHighlightedNeighbors}
                                />
                            ) : (
                                <BettingTable
                                    currentBets={currentBets}
                                    selectedChip={AVAILABLE_CHIPS.find(c => c.value === selectedChip)!}
                                    onPlaceBet={handlePlaceBet}
                                    gamePhase={phase}
                                    quantumMultipliers={quantumMultipliers}
                                    highlightedNumbers={highlightedNeighbors}
                                    heatmapActive={heatmapActive}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* SECTION 3: BOTTOM CONTROLS (Desktop Only) */}
            <footer className="relative z-40 w-full shrink-0 hidden md:block bg-gradient-to-t from-black/90 to-transparent">
                <GameControls
                    selectedChip={selectedChip}
                    onSelectChip={setSelectedChip}
                    onUndo={handleUndo}
                    onClear={handleClear}
                    gamePhase={phase}
                    totalBet={totalBetAmount}
                    balance={balance}
                    showRacetrack={showRacetrack}
                    onToggleRacetrack={() => setShowRacetrack(!showRacetrack)}
                    heatmapActive={heatmapActive}
                    onToggleHeatmap={() => setHeatmapActive(!heatmapActive)}
                    autoPlayActive={autoPlayActive}
                    onToggleAutoPlay={() => setAutoPlayActive(!autoPlayActive)}
                    onSaveLayout={handleSaveLayout}
                    onLoadLayout={handleLoadLayout}
                />
            </footer>

            {/* MOBILE BOTTOM TRIGGER (Mobile Only) */}
            <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
                <button
                    onClick={() => setIsChipsOpen(!isChipsOpen)}
                    className="flex items-center gap-2 px-6 py-2 bg-neo-bg/90 backdrop-blur-md rounded-full border border-neo-gold/30 shadow-xl"
                >
                    <Coins className="w-5 h-5 text-neo-gold" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Select Chips</span>
                </button>
            </div>

            {/* PERSISTENT OVERLAYS */}
            <WheelDrawer
                isOpen={isDrawerOpen}
                onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
                gamePhase={phase}
                winningNumber={winningNumber}
                timeLeft={timeLeft}
            />

            <WinAnnouncement winningNumber={winningNumber} isOpen={isDrawerOpen} gamePhase={phase} />

            <AnimatePresence>
                {/* Profile Drawer (Top) */}
                {isProfileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProfileOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            className="md:hidden fixed top-0 left-0 w-full z-[100] glass-panel border-b border-neo-gold/30 shadow-2xl"
                        >
                            <div className="relative">
                                <GameHeader user={user} stats={stats} balance={balance} phase={phase} timeLeft={timeLeft} />
                                <button
                                    onClick={() => setIsProfileOpen(false)}
                                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 p-2 bg-neo-bg/90 backdrop-blur-md rounded-full border border-neo-gold/30 shadow-lg text-neo-gold hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Chips Drawer (Bottom) */}
                {isChipsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsChipsOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="md:hidden fixed bottom-0 left-0 w-full z-[100] glass-panel border-t border-neo-gold/30 shadow-2xl pt-2 pb-8"
                        >
                            <div className="relative">
                                <button
                                    onClick={() => setIsChipsOpen(false)}
                                    className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-neo-bg/90 backdrop-blur-md rounded-full border border-neo-gold/30 shadow-lg text-neo-gold hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <GameControls
                                    selectedChip={selectedChip}
                                    onSelectChip={(c) => { setSelectedChip(c); setIsChipsOpen(false); }}
                                    onUndo={handleUndo}
                                    onClear={handleClear}
                                    gamePhase={phase}
                                    totalBet={totalBetAmount}
                                    balance={balance}
                                    showRacetrack={showRacetrack}
                                    onToggleRacetrack={() => setShowRacetrack(!showRacetrack)}
                                    heatmapActive={heatmapActive}
                                    onToggleHeatmap={() => setHeatmapActive(!heatmapActive)}
                                    autoPlayActive={autoPlayActive}
                                    onToggleAutoPlay={() => setAutoPlayActive(!autoPlayActive)}
                                    onSaveLayout={handleSaveLayout}
                                    onLoadLayout={handleLoadLayout}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* FLOATING STATS TOGGLE BUTTON - RIGHT SIDE */}
            <button
                onClick={() => setIsStatsOpen(true)}
                className="
                    fixed top-1/2 -translate-y-1/2 right-0 
                    z-40 pl-3 pr-2 py-4
                    bg-neo-bg/90 backdrop-blur-xl
                    border-l border-t border-b border-neo-gold/20
                    rounded-l-xl
                    shadow-[-5px_0_15px_rgba(0,0,0,0.5)]
                    hover:pr-4 hover:bg-neo-bg
                    transition-all duration-300 group
                "
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neo-gold animate-pulse"></span>
                    <span className="
                        text-[10px] uppercase font-bold text-neo-gold 
                        [writing-mode:vertical-rl] tracking-widest rotate-180
                        group-hover:text-white transition-colors
                    ">
                        Stats
                    </span>
                </div>
            </button>

            {/* Slide-Out Stats Panel */}
            <SlideOutPanel
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                history={history}
                leaderboard={leaderboard}
                currentRoundId={lastRoundIdRef.current}
            />

            <InstallPrompt />

            {/* Toast Notification System */}
            {notification && (
                <div className="absolute top-20 landscape:top-4 left-1/2 -translate-x-1/2 glass-panel px-6 md:px-8 py-3 md:py-4 rounded-full flex items-center gap-3 md:gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-[100] border border-white/10 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className={`w-2 md:w-3 h-2 md:h-3 rounded-full ${notification.type === 'error' ? 'bg-red-500 shadow-[0_0_10px_red]' : notification.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-neo-accent shadow-[0_0_10px_blue]'} animate-pulse`}></div>
                    <span className="font-display font-bold uppercase tracking-wider text-xs md:text-sm text-white whitespace-nowrap">{notification.msg}</span>
                </div>
            )}
        </div>
    );
};

export default App;
