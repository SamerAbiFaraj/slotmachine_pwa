import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { BetType, Chip, PlacedBet, GamePhase, QuantumMultiplier } from '../types';
import { getNumberColor, RED_NUMBERS, BLACK_NUMBERS, PAYOUTS } from '../constants-orginal';
import { getAnimalImagePath } from '../animalMapping';
import { chipMapping, chipValues } from '../chipMapping';

interface Props {
  currentBets: PlacedBet[];
  selectedChip: Chip;
  onPlaceBet: (type: BetType, numbers: string[], payout: number) => void;
  gamePhase: GamePhase;
  quantumMultipliers: QuantumMultiplier[];
  highlightedNumbers?: string[];
  heatmapActive?: boolean;
}

interface HoveredBetInfo {
  type: BetType;
  numbers: string[];
  payoutRatio: number;
  x: number;
  y: number;
}

export const BettingTable: React.FC<Props> = ({
  currentBets, selectedChip, onPlaceBet, gamePhase, quantumMultipliers, highlightedNumbers, heatmapActive
}) => {
  const [hoveredBet, setHoveredBet] = useState<HoveredBetInfo | null>(null);
  const [hoveredChip, setHoveredChip] = useState<HoveredBetInfo | null>(null);
  const isInteractable = gamePhase === GamePhase.WAITING_FOR_BETS;

  const handleBet = (type: BetType, numbers: string[], payout: number) => {
    if (!isInteractable) return;
    onPlaceBet(type, numbers, payout);
  };

  const renderChipStack = (amount: number, payoutRatio: number, type: BetType, numbers: string[]) => {
    const sortedValues = [...chipValues].sort((a, b) => b - a);
    const bestChipValue = sortedValues.find(val => val <= amount) || chipValues[0];
    const chipImage = chipMapping[bestChipValue] || chipMapping[chipValues[0]];

    const formatAmount = (amt: number): string => {
      if (amt >= 1000) return `${(amt / 1000).toFixed(0)}k`;
      return amt.toString();
    };

    const handleChipMouseEnter = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Set both hoveredChip AND hoveredBet with the same data
      const hoverData = {
        type,
        numbers,
        payoutRatio,
        x: e.clientX,
        y: e.clientY
      };
      //setHoveredChip(hoverData);
      setHoveredBet(hoverData);
    };

    const handleChipMouseMove = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Update both states
      const hoverData = {
        type,
        numbers,
        payoutRatio,
        x: e.clientX,
        y: e.clientY
      };
      // setHoveredChip(hoverData);
      setHoveredBet(hoverData);
    };

    const handleChipMouseLeave = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Clear both states
      setHoveredChip(null);
      setHoveredBet(null);
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce-short">
        <div
          className="absolute rounded-full bg-black/60 translate-y-0.5 translate-x-0.5 blur-[1px] w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9"
        ></div>
        <div
          className="relative flex items-center justify-center pointer-events-auto cursor-pointer w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-11 xl:h-11"
          onMouseEnter={handleChipMouseEnter}
          onMouseMove={handleChipMouseMove}
          onMouseLeave={handleChipMouseLeave}
        >
          <img src={chipImage} alt={`${amount} chip`} className="w-full h-full object-contain z-10" />
          <span
            className="absolute font-bold text-white drop-shadow-md z-20 pointer-events-none text-[0.5rem] sm:text-[0.55rem] md:text-[0.6rem] lg:text-[0.625rem]"
          >
            {formatAmount(amount)}
          </span>
        </div>
      </div>
    );
  };

  const getBetAmount = (type: BetType, numbers: string[]) => {
    const sortedTarget = [...numbers].sort();
    const bets = currentBets.filter(b => b.type === type && JSON.stringify([...b.numbers].sort()) === JSON.stringify(sortedTarget));
    if (bets.length === 0) return null;
    return bets.reduce((sum, b) => sum + b.amount, 0);
  };

  const handleMouseEnter = (e: React.MouseEvent, type: BetType, numbers: string[], payoutRatio: number) => {
    const amount = getBetAmount(type, numbers);
    if (!amount) return;

    setHoveredBet({
      type,
      numbers,
      payoutRatio,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredBet) {
      setHoveredBet(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  const renderCell = (numStr: string) => {
    const color = getNumberColor(numStr);
    const amount = getBetAmount(BetType.STRAIGHT, [numStr]);
    const multiplier = quantumMultipliers.find(q => q.number === numStr);
    const isHighlighted = highlightedNumbers?.includes(numStr);
    const animalImagePath = getAnimalImagePath(numStr);

    return (
      <div
        key={numStr}
        onClick={() => handleBet(BetType.STRAIGHT, [numStr], PAYOUTS.STRAIGHT)}
        onMouseEnter={(e) => handleMouseEnter(e, BetType.STRAIGHT, [numStr], PAYOUTS.STRAIGHT)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredBet(null)}
        className={`
          relative aspect-[3/4] flex flex-col items-center justify-center border border-neo-gold/20
          transition-all duration-200 cursor-pointer group overflow-hidden
          hover:bg-neo-gold/10 hover:shadow-[inset_0_0_20px_rgba(226,182,89,0.2)]
          ${isHighlighted ? 'bg-neo-gold/40' : 'bg-transparent'}
        `}
        style={{ padding: 'clamp(0.125rem, 0.5vw, 0.375rem)' }}
      >
        {multiplier && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neo-accent/20 animate-pulse overflow-hidden">
            <span
              className="text-neo-accent font-bold drop-shadow-[0_0_5px_rgba(14,165,233,1)]"
              style={{ fontSize: 'clamp(0.5rem, 2.5vw, 0.875rem)' }}
            >
              ⚡{multiplier.multiplier}x
            </span>
          </div>
        )}
        {animalImagePath && (
          <div
            className="flex items-center justify-center pointer-events-none flex-shrink-0"
            style={{
              width: 'clamp(1.25rem, 5vw, 4.5rem)',
              height: 'clamp(1.25rem, 5vw, 4.5rem)',
              marginBottom: 'clamp(0.0625rem, 0.2vw, 0.125rem)'
            }}
          >
            <img
              src={animalImagePath}
              alt={`Animal ${numStr}`}
              className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110"
              loading="lazy"
            />
          </div>
        )}
        <span
          className={`font-display font-bold drop-shadow-md transition-transform group-hover:scale-110 pointer-events-none flex-shrink-0 ${color === 'red' ? 'text-red-500' : 'text-gray-100'}`}
          style={{ fontSize: 'clamp(0.75rem, 2.5vw, 1.75rem)', lineHeight: 1 }}
        >
          {numStr}
        </span>
        {amount && renderChipStack(amount, PAYOUTS.STRAIGHT, BetType.STRAIGHT, [numStr])}
      </div>
    );
  };

  const renderBetHotspot = (type: BetType, numbers: string[], payout: number, className: string) => (
    <div
      onClick={(e) => { e.stopPropagation(); handleBet(type, numbers, payout); }}
      onMouseEnter={(e) => handleMouseEnter(e, type, numbers, payout)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredBet(null)}
      className={`absolute z-40 cursor-pointer hover:bg-white/20 transition-colors group flex items-center justify-center ${className}`}
    >
      {getBetAmount(type, numbers) && renderChipStack(getBetAmount(type, numbers)!, payout, type, numbers)}
    </div>
  );

  return (
    <div
      className="w-full select-none felt-texture rounded-xl border-[2px] md:border-[3px] border-[#1e293b] shadow-2xl relative overflow-hidden  flex flex-col"
      style={{ padding: 'clamp(0.25rem, 1.5vw, 1.5rem)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>


      {/* Floating Tooltip */}
      {hoveredBet && (() => {
        // Calculate tooltip dimensions (approximate)
        const tooltipWidth = 200; // approximate width of tooltip
        const tooltipHeight = 120; // approximate height of tooltip
        const chipSelectorHeight = 100; // height of bottom chip selector bar

        // Get viewport dimensions
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

        // Check if we're on md breakpoint or larger (768px+)
        const isMdOrLarger = viewportWidth >= 768;

        // Adjust offset based on screen size (closer on mobile)
        const offset = isMdOrLarger ? 20 : 10;

        // Adjust effective viewport height to account for chip selector on md+
        const effectiveViewportHeight = isMdOrLarger ? viewportHeight - chipSelectorHeight : viewportHeight;

        // Check if tooltip would overflow on the right
        const wouldOverflowRight = hoveredBet.x + offset + tooltipWidth > viewportWidth;

        // Check if tooltip would overflow on the bottom (accounting for chip selector)
        const wouldOverflowBottom = hoveredBet.y + tooltipHeight > effectiveViewportHeight;

        // Check if tooltip would overflow on the top
        const wouldOverflowTop = hoveredBet.y - tooltipHeight - offset < 0;

        // Calculate horizontal position
        let left = wouldOverflowRight ? hoveredBet.x - tooltipWidth - offset : hoveredBet.x + offset;

        // Calculate vertical position with top/bottom overflow detection
        let top;
        let transform;

        if (wouldOverflowTop) {
          // Position below cursor if it would overflow at top
          top = hoveredBet.y + offset;
          transform = 'translate(0, 0)';
        } else if (wouldOverflowBottom) {
          // Position above cursor if it would overflow at bottom
          top = hoveredBet.y - tooltipHeight - offset;
          transform = 'translate(0, 0)';
        } else {
          // Normal position (centered vertically on cursor)
          top = hoveredBet.y - 40;
          transform = 'translate(0, -50%)';
        }

        return (
          <div
            className="fixed z-[100] pointer-events-none bg-black/90 border-2 border-yellow-500 rounded-lg p-2 md:p-3 shadow-[0_0_20px_rgba(226,182,89,0.5)] backdrop-blur-md animate-in fade-in zoom-in duration-200"
            style={{
              left: left,
              top: top,
              transform: transform,
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)'
            }}
          >
            <div className="text-neo-gold uppercase tracking-wider mb-1 font-bold" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.625rem)' }}>
              Current Bet Info
            </div>
            <div className="flex flex-col gap-0.5 md:gap-1">
              <div className="flex justify-between gap-4 md:gap-8">
                <span className="text-gray-400">Total Bet:</span>
                <span className="text-white font-bold">${getBetAmount(hoveredBet.type, hoveredBet.numbers)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 md:gap-8">
                <span className="text-gray-400">Potential Win:</span>
                <span className="text-green-400 font-bold">
                  ${((getBetAmount(hoveredBet.type, hoveredBet.numbers) || 0) * hoveredBet.payoutRatio).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-white/10 flex justify-between gap-4 md:gap-8">
                <span className="text-gray-500" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.625rem)' }}>Payout:</span>
                <span className="text-neo-gold" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.625rem)' }}>{hoveredBet.payoutRatio}:1</span>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Chip Hover Tooltip */}
      {hoveredChip && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] pointer-events-none bg-gradient-to-br from-neo-gold/20 to-black/95 border-2 border-yellow-500 rounded-lg p-2 shadow-[0_0_25px_rgba(226,182,89,0.4)] backdrop-blur-md animate-in fade-in zoom-in duration-150"
          style={{
            left: hoveredChip.x + 15,
            top: hoveredChip.y - 70,
            fontSize: 'clamp(0.625rem, 2vw, 0.6875rem)'
          }}
        >
          <div className="text-neo-gold uppercase tracking-widest mb-1 font-bold drop-shadow-md" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.5625rem)' }}>
            💰 Chip Info
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Bet:</span>
              <span className="text-white font-bold">${getBetAmount(hoveredChip.type, hoveredChip.numbers)?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Win:</span>
              <span className="text-green-400 font-bold">
                ${((getBetAmount(hoveredChip.type, hoveredChip.numbers) || 0) * hoveredChip.payoutRatio).toLocaleString()}
              </span>
            </div>
            <div className="mt-0.5 pt-0.5 border-t border-neo-gold/30 flex justify-between gap-4">
              <span className="text-gray-400" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.5625rem)' }}>{hoveredChip.payoutRatio}:1</span>
              <span className="text-neo-gold" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.5625rem)' }}>⚡</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MAIN TABLE GRID WRAPPER */}
      <div className="relative z-10 flex flex-1 rounded overflow-hidden border border-neo-gold/30 md:border-2 shadow-lg bg-black/20 min-h-0">

        {/* ZERO and DOUBLE ZERO (LEFT COLUMN) */}
        <div
          className="flex flex-col border-r border-neo-gold/30 relative"
          style={{ width: 'clamp(3rem, 12vw, 6rem)' }}
        >
          <div
            onClick={() => handleBet(BetType.ZERO, ["0"], PAYOUTS.STRAIGHT)}
            onMouseEnter={(e) => handleMouseEnter(e, BetType.ZERO, ["0"], PAYOUTS.STRAIGHT)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBet(null)}
            className="flex-1 flex flex-col items-center justify-center border-b border-neo-gold/30 text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {getAnimalImagePath("0") && (
              <img
                src={getAnimalImagePath("0")}
                alt="0"
                className="object-contain mb-0.5 md:mb-2"
                style={{
                  width: 'clamp(2rem, 7vw, 5rem)',
                  height: 'clamp(2rem, 7vw, 5rem)'
                }}
              />
            )}
            <span style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)' }}>0</span>
            {getBetAmount(BetType.ZERO, ["0"]) && renderChipStack(getBetAmount(BetType.ZERO, ["0"])!, PAYOUTS.STRAIGHT, BetType.ZERO, ["0"])}
          </div>
          <div
            onClick={() => handleBet(BetType.STRAIGHT, ["00"], PAYOUTS.STRAIGHT)}
            onMouseEnter={(e) => handleMouseEnter(e, BetType.STRAIGHT, ["00"], PAYOUTS.STRAIGHT)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBet(null)}
            className="flex-1 flex flex-col items-center justify-center text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {getAnimalImagePath("00") && (
              <img
                src={getAnimalImagePath("00")}
                alt="00"
                className="object-contain mb-0.5 md:mb-2"
                style={{
                  width: 'clamp(2rem, 7vw, 5rem)',
                  height: 'clamp(2rem, 7vw, 5rem)'
                }}
              />
            )}
            <span style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)' }}>00</span>
            {getBetAmount(BetType.STRAIGHT, ["00"]) && renderChipStack(getBetAmount(BetType.STRAIGHT, ["00"])!, PAYOUTS.STRAIGHT, BetType.STRAIGHT, ["00"])}
          </div>
          {/* Basket Bet */}
          {renderBetHotspot(
            BetType.BASKET,
            ["0", "00", "1", "2", "3"],
            PAYOUTS.BASKET,
            "right-[-8px] md:right-[-10px] top-[calc(50%-8px)] md:top-[calc(50%-10px)] w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/5 border border-white/10"
          )}
          {/* Split 0-00 */}
          {renderBetHotspot(
            BetType.SPLIT,
            ["0", "00"],
            PAYOUTS.SPLIT,
            "bottom-[-8px] md:bottom-[-10px] left-[calc(50%-8px)] md:left-[calc(50%-10px)] w-4 h-4 md:w-5 md:h-5 rounded-full"
          )}
        </div>

        {/* MAIN NUMBERS GRID (MIDDLE) */}
        <div className="flex-1 relative flex flex-col">
          <div className="grid grid-cols-12 relative">
            {[3, 2, 1].map((row) => (
              <React.Fragment key={row}>
                {Array.from({ length: 12 }, (_, colIndex) => {
                  const num = (colIndex * 3 + row).toString();
                  const nextInCol = row > 1 ? (colIndex * 3 + row - 1).toString() : null;
                  const nextInRow = colIndex < 11 ? ((colIndex + 1) * 3 + row).toString() : null;
                  const diag = (row > 1 && colIndex < 11) ? ((colIndex + 1) * 3 + row - 1).toString() : null;

                  return (
                    <div key={num} className="relative">
                      {renderCell(num)}

                      {/* Split Vertical */}
                      {nextInCol && renderBetHotspot(BetType.SPLIT, [num, nextInCol], PAYOUTS.SPLIT, "absolute bottom-[-10px] left-0 right-0 h-5 z-40")}

                      {/* Split Horizontal */}
                      {nextInRow && renderBetHotspot(BetType.SPLIT, [num, nextInRow], PAYOUTS.SPLIT, "absolute right-[-10px] top-0 bottom-0 w-5 z-40")}

                      {/* Corner */}
                      {nextInCol && nextInRow && diag && renderBetHotspot(BetType.CORNER, [num, nextInCol, nextInRow, diag], PAYOUTS.CORNER, "absolute right-[-8px] md:right-[-10px] bottom-[-8px] md:bottom-[-10px] w-4 h-4 md:w-5 md:h-5 rounded-full z-50 bg-white/5 border border-white/10")}

                      {/* Street */}
                      {row === 1 && renderBetHotspot(BetType.STREET, [(colIndex * 3 + 1).toString(), (colIndex * 3 + 2).toString(), (colIndex * 3 + 3).toString()], PAYOUTS.STREET, "absolute bottom-[-15px] md:bottom-[-20px] left-0 right-0 h-3 md:h-4 bg-white/5 rounded-t")}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* DOZENS */}
          <div
            className="grid grid-cols-3 border-t border-neo-gold/30"
            style={{ height: 'clamp(3.5rem, 8vw, 5rem)' }}
          >
            {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => {
              const nums = Array.from({ length: 12 }, (_, i) => (i + 1 + idx * 12).toString());
              return (
                <div
                  key={label}
                  onClick={() => handleBet(BetType.DOZEN, nums, PAYOUTS.DOZEN)}
                  onMouseEnter={(e) => handleMouseEnter(e, BetType.DOZEN, nums, PAYOUTS.DOZEN)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredBet(null)}
                  className="relative flex-1 flex items-center justify-center bg-transparent hover:bg-white/5 cursor-pointer font-bold text-neo-gold border-r border-neo-gold/20 last:border-0 transition-colors"
                  style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="inline sm:hidden">{label.split(' ')[0]}</span>
                  {getBetAmount(BetType.DOZEN, nums) && renderChipStack(getBetAmount(BetType.DOZEN, nums)!, PAYOUTS.DOZEN, BetType.DOZEN, nums)}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNS (RIGHT) */}
        <div
          className="flex flex-col border-l border-neo-gold/30"
          style={{ width: 'clamp(3rem, 12vw, 6rem)' }}
        >
          {[3, 2, 1].map(row => {
            const nums = Array.from({ length: 12 }, (_, i) => (i * 3 + row).toString());
            return (
              <div
                key={row}
                onClick={() => handleBet(BetType.COLUMN, nums, PAYOUTS.COLUMN)}
                onMouseEnter={(e) => handleMouseEnter(e, BetType.COLUMN, nums, PAYOUTS.COLUMN)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredBet(null)}
                className="relative flex-1 flex items-center justify-center bg-transparent hover:bg-white/5 cursor-pointer border-b border-neo-gold/20 last:border-0 transition-colors"
              >
                <span
                  className="rotate-360 whitespace-nowrap font-bold text-neo-gold"
                  style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
                >
                  2 TO 1
                </span>
                {getBetAmount(BetType.COLUMN, nums) && renderChipStack(getBetAmount(BetType.COLUMN, nums)!, PAYOUTS.COLUMN, BetType.COLUMN, nums)}
              </div>
            );
          })}
          {/* <div
            className="border-t border-neo-gold/20"
            style={{ height: 'clamp(3rem, 7vw, 4.5rem)' }}
          ></div> */}
        </div>
      </div>

      {/* BOTTOM ROW: EVEN CHANCE */}
      <div
        className="grid grid-cols-6 relative z-10 shrink-0"
        style={{
          marginTop: 'clamp(0.25rem, 1vw, 0.75rem)',
          height: 'clamp(2.5rem, 7vw, 4.5rem)',
          gap: 'clamp(0.25rem, 0.8vw, 0.5rem)',
        }}
      >
        {[
          { label: "1-18", nums: Array.from({ length: 18 }, (_, i) => (i + 1).toString()), ratio: PAYOUTS.HIGH_LOW, type: BetType.HIGH_LOW },
          { label: "EVEN", nums: Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 === 0), ratio: PAYOUTS.EVEN_ODD, type: BetType.EVEN_ODD },
          { label: "RED", nums: RED_NUMBERS, ratio: PAYOUTS.RED_BLACK, type: BetType.RED_BLACK, special: 'red' },
          { label: "BLACK", nums: BLACK_NUMBERS, ratio: PAYOUTS.RED_BLACK, type: BetType.RED_BLACK, special: 'black' },
          { label: "ODD", nums: Array.from({ length: 36 }, (_, i) => (i + 1).toString()).filter(n => parseInt(n) % 2 !== 0), ratio: PAYOUTS.EVEN_ODD, type: BetType.EVEN_ODD },
          { label: "19-36", nums: Array.from({ length: 18 }, (_, i) => (i + 19).toString()), ratio: PAYOUTS.HIGH_LOW, type: BetType.HIGH_LOW }
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => handleBet(item.type, item.nums, item.ratio)}
            onMouseEnter={(e) => handleMouseEnter(e, item.type, item.nums, item.ratio)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBet(null)}
            className={`
              relative border border-neo-gold/20 flex items-center justify-center cursor-pointer transition-colors
              ${item.special === 'red' ? 'hover:bg-red-900/40' : item.special === 'black' ? 'hover:bg-gray-800/40' : 'hover:bg-white/5'}
            `}
          >
            {item.special === 'red' ? (
              <div
                className="bg-red-600 rotate-45 border md:border-2 border-red-400 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
              ></div>
            ) : item.special === 'black' ? (
              <div
                className="bg-black rotate-45 border md:border-2 border-gray-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
              ></div>
            ) : (
              <span
                className="font-bold text-neo-gold uppercase"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
              >
                {item.label}
              </span>
            )}
            {getBetAmount(item.type, item.nums) && renderChipStack(getBetAmount(item.type, item.nums)!, item.ratio, item.type, item.nums)}
          </div>
        ))}
      </div>
    </div>
  );
};