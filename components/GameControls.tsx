import React from 'react';
import { Chip, GamePhase } from '../types';
import { AVAILABLE_CHIPS } from '../constants-orginal';
import { chipMapping } from '../chipMapping'; // ✅ Import chip mapping

interface Props {
   selectedChip: number;
   onSelectChip: (value: number) => void;
   onClear: () => void;
   onUndo: () => void;
   gamePhase: GamePhase;
   totalBet: number;
   balance: number;
   showRacetrack: boolean;
   onToggleRacetrack: () => void;
   heatmapActive: boolean;
   onToggleHeatmap: () => void;
   autoPlayActive: boolean;
   onToggleAutoPlay: () => void;
   onSaveLayout: () => void;
   onLoadLayout: () => void;
}

export const GameControls: React.FC<Props> = ({
   selectedChip, onSelectChip, onClear, onUndo, gamePhase, totalBet,
   showRacetrack, onToggleRacetrack, autoPlayActive, onToggleAutoPlay, onSaveLayout, onLoadLayout
}) => {
   const isBetting = gamePhase === GamePhase.WAITING_FOR_BETS;

   const ActionBtn = ({ label, onClick, disabled, active, icon }: any) => (
      <button
         onClick={onClick}
         disabled={disabled}
         className={`
      glass-button px-2.5 md:px-4 lg:px-5 py-2.5 md:py-3 lg:py-3.5 rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all
      ${active
               ? 'bg-neo-gold text-black border-neo-gold shadow-[0_0_15px_rgba(226,182,89,0.5)]'
               : 'text-gray-300 hover:text-white hover:bg-white/10'
            }
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
      >
         {icon}
         <span className="text-[9px] md:text-[10px] lg:text-xs font-bold uppercase tracking-widest hidden sm:inline">{label}</span>
      </button>
   );

   return (
      <div className="w-full flex justify-center px-2 md:px-4">
         <div className="glass-panel rounded-2xl md:rounded-3xl p-2 md:p-3 lg:p-4 flex flex-row items-center gap-2 md:gap-3 lg:gap-4 shadow-2xl relative max-w-full overflow-x-auto scrollbar-hide">

            {/* Pro Tools (Left) - Responsive button sizing */}
            <div className="flex gap-1.5 md:gap-2 shrink-0">
               <ActionBtn
                  label="Race"
                  onClick={onToggleRacetrack}
                  active={showRacetrack}
                  icon={<svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
               />
               <ActionBtn
                  label="Auto"
                  onClick={onToggleAutoPlay}
                  active={autoPlayActive}
                  icon={<svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
               />
            </div>

            <div className="w-[1px] h-10 md:h-12 bg-white/10 shrink-0"></div>

            {/* CHIP RACK - Responsive chip sizing */}
            <div className="bg-black/40 rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-white/5 flex gap-1.5 md:gap-2 lg:gap-3 shadow-inner overflow-x-auto scrollbar-hide shrink-0">
               {AVAILABLE_CHIPS.map((chip) => (
                  <button
                     key={chip.value}
                     onClick={() => onSelectChip(chip.value)}
                     disabled={!isBetting}
                     className={`
              relative w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center
              transition-all duration-200 shrink-0
              ${selectedChip === chip.value
                           ? 'scale-110 -translate-y-2 md:-translate-y-3 lg:-translate-y-4 z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]'
                           : 'hover:-translate-y-1 hover:brightness-110'
                        }
              ${!isBetting && 'grayscale opacity-50'}
            `}
                  >
                     <img
                        src={chipMapping[chip.value]}
                        alt={`${chip.value} chip`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                           console.error('Failed to load chip image:', chipMapping[chip.value]);
                           e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiMwMDAiLz48dGV4dCB4PSIxMCIgeT0iMTQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDAwIj4/IjwvdGV4dD48L3N2Zz4=';
                        }}
                     />
                  </button>
               ))}
            </div>

            <div className="w-[1px] h-10 md:h-12 bg-white/10 shrink-0"></div>

            {/* Actions (Right) - Responsive sizing */}
            <div className="flex gap-1.5 md:gap-2 shrink-0">
               <ActionBtn
                  label="Undo"
                  onClick={onUndo}
                  disabled={!isBetting || totalBet === 0}
                  icon={<svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
               />
               <ActionBtn
                  label="Clear"
                  onClick={onClear}
                  disabled={!isBetting || totalBet === 0}
                  icon={<svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
               />

               {/* Save/Load - Stack vertically on small screens */}
               <div className="flex flex-col gap-0.5 ml-1 md:ml-2 shrink-0">
                  <button
                     onClick={onSaveLayout}
                     className="text-[8px] md:text-[9px] lg:text-[10px] text-neo-gold hover:text-white uppercase font-bold text-left px-1.5 md:px-2 py-0.5"
                  >
                     Save
                  </button>
                  <button
                     onClick={onLoadLayout}
                     className="text-[8px] md:text-[9px] lg:text-[10px] text-neo-gold hover:text-white uppercase font-bold text-left px-1.5 md:px-2 py-0.5"
                  >
                     Load
                  </button>
               </div>
            </div>

         </div>
      </div>
   );
};