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
      setHoveredChip({
        type,
        numbers,
        payoutRatio,
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleChipMouseMove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredChip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    };

    const handleChipMouseLeave = (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredChip(null);
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce-short">
        <div className="absolute w-4 h-4 md:w-7 md:h-7 rounded-full bg-black/60 translate-y-0.5 translate-x-0.5 blur-[1px]"></div>
        <div
          className="relative w-5 h-5 md:w-8 md:h-8 flex items-center justify-center pointer-events-auto cursor-pointer"
          onMouseEnter={handleChipMouseEnter}
          onMouseMove={handleChipMouseMove}
          onMouseLeave={handleChipMouseLeave}
        >
          <img src={chipImage} alt={`${amount} chip`} className="w-full h-full object-contain z-10" />
          <span className="absolute text-[7px] md:text-[8px] font-bold text-white drop-shadow-md z-20 pointer-events-none">{formatAmount(amount)}</span>
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
          relative h-12 sm:h-14 md:h-16 lg:h-20 xl:h-24 flex flex-col items-center justify-center border border-neo-gold/20
          transition-all duration-200 cursor-pointer group
          hover:bg-neo-gold/10 hover:shadow-[inset_0_0_20px_rgba(226,182,89,0.2)]
          ${isHighlighted ? 'bg-neo-gold/40' : 'bg-transparent'}
        `}
      >
        {multiplier && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neo-accent/20 animate-pulse overflow-hidden">
            <span className="text-neo-accent font-bold text-[8px] md:text-xs drop-shadow-[0_0_5px_rgba(14,165,233,1)]">⚡{multiplier.multiplier}x</span>
          </div>
        )}
        {animalImagePath && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 mb-0.5 md:mb-1 flex items-center justify-center pointer-events-none">
            <img src={animalImagePath} alt={`Animal ${numStr}`} className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110" />
          </div>
        )}
        <span className={`font-display text-xs sm:text-sm md:text-lg font-bold drop-shadow-md transition-transform group-hover:scale-110 pointer-events-none ${color === 'red' ? 'text-red-500' : 'text-gray-100'}`}>
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
    <div className="
    w-full 
    select-none felt-texture 
    p-3 md:p-6 lg:p-8 
    rounded-xl 
    border-[3px] md:border-[6px] lg:border-[8px] 
    border-[#1e293b] 
    shadow-2xl relative overflow-hidden
  ">
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>

      {/* Floating Tooltip */}
      {hoveredBet && (
        <div
          className="fixed z-[100] pointer-events-none bg-black/90 border border-neo-gold/50 rounded-lg p-2 md:p-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in zoom-in duration-200"
          style={{
            left: hoveredBet.x + 20,
            top: hoveredBet.y - 40,
            transform: 'translate(0, -50%)'
          }}
        >
          <div className="text-neo-gold text-[8px] md:text-[10px] uppercase tracking-wider mb-1 font-bold">Current Bet Info</div>
          <div className="flex flex-col gap-0.5 md:gap-1">
            <div className="flex justify-between gap-4 md:gap-8">
              <span className="text-gray-400 text-[10px] md:text-xs">Total Bet:</span>
              <span className="text-white text-[10px] md:text-xs font-bold">${getBetAmount(hoveredBet.type, hoveredBet.numbers)?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4 md:gap-8">
              <span className="text-gray-400 text-[10px] md:text-xs">Potential Win:</span>
              <span className="text-green-400 text-[10px] md:text-xs font-bold">
                ${((getBetAmount(hoveredBet.type, hoveredBet.numbers) || 0) * hoveredBet.payoutRatio).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 pt-1 border-t border-white/10 flex justify-between gap-4 md:gap-8">
              <span className="text-gray-500 text-[8px] md:text-[10px]">Payout:</span>
              <span className="text-neo-gold text-[8px] md:text-[10px]">{hoveredBet.payoutRatio}:1</span>
            </div>
          </div>
        </div>
      )}

      {/* Chip Hover Tooltip */}
      {hoveredChip && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] pointer-events-none bg-gradient-to-br from-neo-gold/20 to-black/95 border-2 border-neo-gold rounded-lg p-2 md:p-2.5 shadow-[0_0_25px_rgba(226,182,89,0.4)] backdrop-blur-md animate-in fade-in zoom-in duration-150"
          style={{
            left: hoveredChip.x + 15,
            top: hoveredChip.y - 70,
          }}
        >
          <div className="text-neo-gold text-[8px] md:text-[9px] uppercase tracking-widest mb-1 font-bold drop-shadow-md">💰 Chip Info</div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between gap-4 md:gap-6">
              <span className="text-gray-300 text-[10px] md:text-[11px]">Bet:</span>
              <span className="text-white text-[10px] md:text-[11px] font-bold">${getBetAmount(hoveredChip.type, hoveredChip.numbers)?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4 md:gap-6">
              <span className="text-gray-300 text-[10px] md:text-[11px]">Win:</span>
              <span className="text-green-400 text-[10px] md:text-[11px] font-bold">
                ${((getBetAmount(hoveredChip.type, hoveredChip.numbers) || 0) * hoveredChip.payoutRatio).toLocaleString()}
              </span>
            </div>
            <div className="mt-0.5 pt-0.5 border-t border-neo-gold/30 flex justify-between gap-4 md:gap-6">
              <span className="text-gray-400 text-[8px] md:text-[9px]">{hoveredChip.payoutRatio}:1</span>
              <span className="text-neo-gold text-[8px] md:text-[9px]">⚡</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MAIN TABLE GRID WRAPPER */}
      <div className="relative z-10 flex rounded overflow-hidden border border-neo-gold/30 md:border-2 shadow-lg bg-black/20">

        {/* ZERO and DOUBLE ZERO (LEFT COLUMN) */}
        <div className="
            w-14 md:w-16 lg:w-20 
            flex flex-col border-r border-neo-gold/30 relative
          ">
          <div
            onClick={() => handleBet(BetType.ZERO, ["0"], PAYOUTS.STRAIGHT)}
            onMouseEnter={(e) => handleMouseEnter(e, BetType.ZERO, ["0"], PAYOUTS.STRAIGHT)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBet(null)}
            className="flex-1 flex flex-col items-center justify-center border-b border-neo-gold/30 text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {getAnimalImagePath("0") && <img src={getAnimalImagePath("0")} alt="0" className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 mb-0.5 md:mb-1 object-contain" />}
            <span className="text-xs sm:text-sm md:text-2xl">0</span>
            {getBetAmount(BetType.ZERO, ["0"]) && renderChipStack(getBetAmount(BetType.ZERO, ["0"])!, PAYOUTS.STRAIGHT, BetType.ZERO, ["0"])}
          </div>
          <div
            onClick={() => handleBet(BetType.STRAIGHT, ["00"], PAYOUTS.STRAIGHT)}
            onMouseEnter={(e) => handleMouseEnter(e, BetType.STRAIGHT, ["00"], PAYOUTS.STRAIGHT)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBet(null)}
            className="flex-1 flex flex-col items-center justify-center text-green-500 font-display font-bold hover:bg-green-900/30 cursor-pointer relative"
          >
            {getAnimalImagePath("00") && <img src={getAnimalImagePath("00")} alt="00" className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 mb-0.5 md:mb-1 object-contain" />}
            <span className="text-xs sm:text-sm md:text-2xl">00</span>
            {getBetAmount(BetType.STRAIGHT, ["00"]) && renderChipStack(getBetAmount(BetType.STRAIGHT, ["00"])!, PAYOUTS.STRAIGHT, BetType.STRAIGHT, ["00"])}
          </div>
          {/* Basket Bet */}
          {renderBetHotspot(BetType.BASKET, ["0", "00", "1", "2", "3"], PAYOUTS.BASKET, "right-[-8px] md:right-[-10px] top-[calc(50%-8px)] md:top-[calc(50%-10px)] w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/5 border border-white/10")}
          {/* Split 0-00 */}
          {renderBetHotspot(BetType.SPLIT, ["0", "00"], PAYOUTS.SPLIT, "bottom-[-8px] md:bottom-[-10px] left-[calc(50%-8px)] md:left-[calc(50%-10px)] w-4 h-4 md:w-5 md:h-5 rounded-full")}
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
                      {/* UPDATE CELL HEIGHT FOR BETTER MOBILE SIZING */}
                      <div className="
                      relative 
                      h-14 md:h-16 lg:h-20 xl:h-24
                      flex flex-col items-center justify-center 
                      border border-neo-gold/20
                      transition-all duration-200 cursor-pointer group
                      hover:bg-neo-gold/10 hover:shadow-[inset_0_0_20px_rgba(226,182,89,0.2)]
                    ">
                        {renderCell(num)}
                      </div>

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
          <div className="
              grid grid-cols-3 
              h-12 md:h-14 lg:h-16
              border-t border-neo-gold/30
            ">
            {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => {
              const nums = Array.from({ length: 12 }, (_, i) => (i + 1 + idx * 12).toString());
              return (
                <div
                  key={label}
                  onClick={() => handleBet(BetType.DOZEN, nums, PAYOUTS.DOZEN)}
                  onMouseEnter={(e) => handleMouseEnter(e, BetType.DOZEN, nums, PAYOUTS.DOZEN)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredBet(null)}
                  className="relative flex-1 flex items-center justify-center bg-transparent hover:bg-white/5 cursor-pointer text-[8px] sm:text-[10px] md:text-xs font-bold text-neo-gold border-r border-neo-gold/20 last:border-0 transition-colors"
                >
                  <span>{label}</span>
                  {getBetAmount(BetType.DOZEN, nums) && renderChipStack(getBetAmount(BetType.DOZEN, nums)!, PAYOUTS.DOZEN, BetType.DOZEN, nums)}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNS (RIGHT) */}
        <div className="
          w-12 md:w-14 lg:w-16
          flex flex-col border-l border-neo-gold/30
        ">
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
                <span className="rotate-180 whitespace-nowrap text-[8px] sm:text-[10px] md:text-[10px] font-bold text-neo-gold">2 TO 1</span>
                {getBetAmount(BetType.COLUMN, nums) && renderChipStack(getBetAmount(BetType.COLUMN, nums)!, PAYOUTS.COLUMN, BetType.COLUMN, nums)}
              </div>
            );
          })}
          <div className="h-10 sm:h-11 md:h-12 lg:h-14 border-t border-neo-gold/20"></div>
        </div>
      </div>

      {/* BOTTOM ROW: EVEN CHANCE */}
      <div className="
          grid grid-cols-6 
          mt-2 md:mt-3 lg:mt-4 
          h-12 md:h-14 lg:h-16
          gap-1.5 md:gap-2 lg:gap-3 
          relative z-10
        ">
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
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-600 rotate-45 border md:border-2 border-red-400"></div>
            ) : item.special === 'black' ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-black rotate-45 border md:border-2 border-gray-600"></div>
            ) : (
              <span className="text-[7px] sm:text-[9px] md:text-xs font-bold text-neo-gold uppercase">{item.label}</span>
            )}
            {getBetAmount(item.type, item.nums) && renderChipStack(getBetAmount(item.type, item.nums)!, item.ratio, item.type, item.nums)}
          </div>
        ))}
      </div>
    </div>
  );
};