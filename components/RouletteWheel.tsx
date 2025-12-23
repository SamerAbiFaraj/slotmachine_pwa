import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RotateCw, Target, Check, Diamond } from 'lucide-react';
import { cn } from '../lib/utils';
import { WHEEL_ORDER, getNumberColor } from '../constants-orginal';
import { getAnimalImagePath, getAnimalName } from '../animalMapping';
import { GamePhase } from '../types';

// TYPES
interface Props {
    phase: GamePhase;
    winningNumber: string | null;
    onBetPlaced?: (number: string, amount: number) => void;
}

// PHYSICS CONFIGURATION
const PHYSICS_CONFIG = {
    initialVelocity: 18,           // Rotations per second (very fast initial spin)
    decayConstant: 0.35,           // Controls slowdown rate (higher = faster slowdown)
    outerRadius: 60,               // Ball radius on outer rim (% of wheel)
    pocketRadius: 30,              // Ball radius in pocket (% of wheel)
    deflectorCount: 8,             // Number of diamond deflectors on rim
    deflectorMagnitude: 4,         // Max deflection angle in degrees
    rattleCount: 3,                // Number of pocket bounces
    totalDuration: 8000,           // Total animation duration (ms)

    // Phase timing (as fraction of total duration)
    outerRimDuration: 0.60,        // 60% of time on outer rim
    spiralDuration: 0.25,          // 25% of time spiraling inward
    settleDuration: 0.15,          // 15% of time settling in pocket
};

// Seeded random number generator for deterministic deflector hits
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Calculate velocity at time t using exponential decay
const calculateVelocity = (t: number, config: typeof PHYSICS_CONFIG): number => {
    const { initialVelocity, decayConstant, totalDuration } = config;
    const normalizedTime = t / totalDuration;
    return initialVelocity * Math.exp(-decayConstant * normalizedTime * 10);
};

// Calculate total angle traveled from 0 to t
const calculateAngleTraveled = (t: number, config: typeof PHYSICS_CONFIG): number => {
    const { initialVelocity, decayConstant, totalDuration } = config;
    const normalizedTime = t / totalDuration;
    const k = decayConstant * 10;

    // Integral of v(t) = v₀ × e^(-k×t) is (v₀/k) × (1 - e^(-k×t))
    const angleInRotations = (initialVelocity / k) * (1 - Math.exp(-k * normalizedTime));
    return angleInRotations * 360; // Convert rotations to degrees
};

// Apply deflector hit at specific intervals
const applyDeflectorHit = (
    baseAngle: number,
    time: number,
    config: typeof PHYSICS_CONFIG,
    rng: SeededRandom
): number => {
    const { deflectorCount, deflectorMagnitude, totalDuration, outerRimDuration } = config;

    // Only apply deflector hits during outer rim phase
    if (time > totalDuration * outerRimDuration) {
        return baseAngle;
    }

    // Calculate which deflector we're near
    const currentRotations = baseAngle / 360;
    const deflectorInterval = 1 / deflectorCount;
    const nearestDeflector = Math.floor(currentRotations / deflectorInterval);
    const distanceToDeflector = (currentRotations % deflectorInterval) / deflectorInterval;

    // Apply hit when very close to deflector (within 5% of interval)
    if (distanceToDeflector < 0.05 || distanceToDeflector > 0.95) {
        const hitStrength = (rng.next() - 0.5) * 2; // -1 to 1
        const deflection = hitStrength * deflectorMagnitude;
        return baseAngle + deflection;
    }

    return baseAngle;
};

// Apply pocket rattle effect (damped oscillation)
const applyPocketRattle = (
    time: number,
    targetAngle: number,
    config: typeof PHYSICS_CONFIG
): number => {
    const { totalDuration, settleDuration, rattleCount } = config;
    const settleStartTime = totalDuration * (1 - settleDuration);

    if (time < settleStartTime) {
        return 0;
    }

    const settleProgress = (time - settleStartTime) / (totalDuration - settleStartTime);
    const frequency = rattleCount * Math.PI * 2;
    const damping = 5;

    // Damped oscillation: A × e^(-ζt) × sin(ωt)
    const amplitude = 8; // degrees
    const rattle = amplitude * Math.exp(-damping * settleProgress) * Math.sin(frequency * settleProgress);

    return rattle;
};

// Calculate ball radius based on current phase
const calculateBallRadius = (time: number, config: typeof PHYSICS_CONFIG): number => {
    const { totalDuration, outerRimDuration, spiralDuration, outerRadius, pocketRadius } = config;
    const outerRimEnd = totalDuration * outerRimDuration;
    const spiralEnd = totalDuration * (outerRimDuration + spiralDuration);

    if (time < outerRimEnd) {
        // Stay on outer rim
        return outerRadius;
    } else if (time < spiralEnd) {
        // Spiral inward
        const spiralProgress = (time - outerRimEnd) / (spiralEnd - outerRimEnd);
        const easeProgress = 1 - Math.pow(1 - spiralProgress, 3); // Ease out cubic
        return outerRadius - (outerRadius - pocketRadius) * easeProgress;
    } else {
        // In pocket
        return pocketRadius;
    }
};

// CONSTANTS
const POCKET_COUNT = 38;
const BALL_LANDING_POSITION = 90;

export const RouletteWheel: React.FC<Props> = ({ phase, winningNumber, onBetPlaced }) => {
    // State
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [ballRadius, setBallRadius] = useState(60);
    const [ballOpacity, setBallOpacity] = useState(0);
    const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastWinningNumber, setLastWinningNumber] = useState<string | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [alignmentDebug, setAlignmentDebug] = useState<string>('');
    const [spinDirection, setSpinDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise');

    // Refs
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Get color for a number
    const getColor = (number: string): 'red' | 'black' | 'green' => {
        return getNumberColor(number);
    };

    // Idle animation
    useEffect(() => {
        if (phase === GamePhase.WAITING_FOR_BETS) {
            cancelAnimationFrame(requestRef.current);
            setIsSpinning(false);

            const idleSpin = () => {
                setWheelRotation(prev => {
                    const newRotation = prev + 0.015;
                    return newRotation >= 360 ? newRotation - 360 : newRotation;
                });
                requestRef.current = requestAnimationFrame(idleSpin);
            };

            requestRef.current = requestAnimationFrame(idleSpin);
            setBallOpacity(0);
        } else if (phase === GamePhase.SPINNING && winningNumber) {
            setIsSpinning(true);
            setLastWinningNumber(winningNumber);
            const dir = Math.random() > 0.5 ? 'clockwise' : 'counterclockwise';
            setSpinDirection(dir);
            cancelAnimationFrame(requestRef.current);
            startSpinSequence(winningNumber, dir);
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [phase, winningNumber]);

    const startSpinSequence = (targetNumber: string, direction: 'clockwise' | 'counterclockwise') => {
        startTimeRef.current = performance.now();
        setBallOpacity(1);

        const targetIndex = WHEEL_ORDER.indexOf(targetNumber);
        if (targetIndex === -1) {
            console.error('Invalid target number:', targetNumber);
            return;
        }

        const anglePerPocket = 360 / POCKET_COUNT;
        const targetPocketAngle = (targetIndex + 0.5) * anglePerPocket;

        // Calculate how much the wheel will rotate
        const startWheelAngle = wheelRotation % 360;
        const wheelIsClockwise = direction === 'clockwise';
        const wheelDirMultiplier = wheelIsClockwise ? 1 : -1;

        // Wheel rotates 5 times
        const wheelExtraRotations = 5;
        const totalWheelRotation = 360 * wheelExtraRotations * wheelDirMultiplier;
        const finalWheelAngle = startWheelAngle + totalWheelRotation;

        // Ball rotates in OPPOSITE direction
        const ballDirMultiplier = -wheelDirMultiplier;

        // Ball needs to land at BALL_LANDING_POSITION (90°) relative to wheel
        // Calculate total ball travel needed
        const totalBallAngle = calculateAngleTraveled(PHYSICS_CONFIG.totalDuration, PHYSICS_CONFIG);

        // Adjust ball starting angle so it lands correctly
        // Final ball angle (absolute) = final wheel angle + target pocket angle + BALL_LANDING_POSITION
        const desiredFinalBallAngle = finalWheelAngle + targetPocketAngle + BALL_LANDING_POSITION;
        const ballStartAngle = desiredFinalBallAngle - (totalBallAngle * ballDirMultiplier);

        // Create seeded random for deterministic deflector hits
        const rng = new SeededRandom(targetIndex * 1000 + Date.now() % 1000);

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;
            const progress = Math.min(elapsed / PHYSICS_CONFIG.totalDuration, 1);

            // Animate wheel rotation (simple ease out)
            const wheelEase = 1 - Math.pow(1 - progress, 3);
            const currentWheelAngle = startWheelAngle + totalWheelRotation * wheelEase;
            setWheelRotation(currentWheelAngle);

            // Calculate ball position using physics
            let ballAngleTraveled = calculateAngleTraveled(elapsed, PHYSICS_CONFIG);
            let currentBallAngle = ballStartAngle + (ballAngleTraveled * ballDirMultiplier);

            // Apply deflector hits
            currentBallAngle = applyDeflectorHit(
                Math.abs(ballAngleTraveled),
                elapsed,
                PHYSICS_CONFIG,
                rng
            ) * ballDirMultiplier + ballStartAngle;

            // Apply pocket rattle
            const rattleOffset = applyPocketRattle(elapsed, desiredFinalBallAngle, PHYSICS_CONFIG);
            currentBallAngle += rattleOffset;

            // Calculate ball radius
            const currentBallRadius = calculateBallRadius(elapsed, PHYSICS_CONFIG);

            setBallRotation(currentBallAngle);
            setBallRadius(currentBallRadius);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                setSelectedNumber(targetNumber);
                // Final position: ensure perfect alignment
                setBallRotation(desiredFinalBallAngle);
                setBallRadius(PHYSICS_CONFIG.pocketRadius);
            }
        };

        requestRef.current = requestAnimationFrame(animate);
    };

    const handleNumberClick = (number: string) => {
        if (phase === GamePhase.WAITING_FOR_BETS && onBetPlaced) {
            setSelectedNumber(number);
            onBetPlaced(number, 10);
        }
    };

    // SVG calculations
    const wheelSize = 600;
    const center = wheelSize / 2;
    const outerRadius = center - 30;
    const innerRadius = 120;
    const pocketAngle = 360 / POCKET_COUNT;
    const imageRadius = outerRadius - 40;
    const numberRadius = imageRadius - 45;

    return (
        <div className="relative flex items-center justify-center p-2 md:p-6">
            {/* Main Wheel Container with 3D Perspective */}
            <div
                className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px]"
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center center'
                }}
            >
                {/* Outer Wooden Frame with Diamond Decorations */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `
              radial-gradient(circle at 30% 30%, #453c0540 0%, #53430fff 30%, #352806ff 60%, #3e300dff 100%)
            `,
                        boxShadow: `
              0 0 0 4px md:0 0 0 8px #1a0f00,
              0 0 0 6px md:0 0 0 12px #D4AF37,
              0 0 0 8px md:0 0 0 16px #1a0f00,
              0 15px 40px md:0 25px 80px rgba(0, 0, 0, 0.8),
              inset 0 -10px 30px rgba(0, 0, 0, 0.6),
              inset 0 10px 30px rgba(255, 255, 255, 0.3)
            `,
                        transform: 'rotateX(15deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Diamond Decorations on Frame */}
                    {[0, 90, 180, 270].map((angle, idx) => (
                        <div
                            key={idx}
                            className="absolute"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${center - 15}px)`,
                            }}
                        >
                            <Diamond
                                className="w-4 h-4 md:w-6 md:h-6 text-[#FFE55C]"
                                fill="#FFD700"
                                style={{
                                    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
                                }}
                            />
                        </div>
                    ))}

                    {/* Inner Bowl Shadow */}
                    <div
                        className="absolute inset-[20px] md:inset-[40px] rounded-full"
                        style={{
                            background: `
                radial-gradient(circle at center, 
                  transparent 0%, 
                  transparent 40%, 
                  rgba(0, 0, 0, 0.4) 70%,
                  rgba(0, 0, 0, 0.8) 100%
                )
              `,
                            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.9)'
                        }}
                    />
                </div>

                {/* Inner Bowl with Gradient Depth */}
                <div
                    className="absolute inset-[25px] md:inset-[45px] rounded-full overflow-hidden"
                    style={{
                        background: `
              radial-gradient(circle at 35% 35%, 
                #1a1a1a 0%, 
                #0a0a0a 40%, 
                #000000 70%,
                #000000 100%
              )
            `,
                        boxShadow: `
              inset 0 15px 40px rgba(0, 0, 0, 0.9),
              inset 0 -5px 20px rgba(255, 215, 0, 0.1)
            `,
                        transform: 'rotateX(15deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Rotating Wheel Numbers and Pockets */}
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: isSpinning ? 'none' : 'transform 0.05s linear',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <svg
                            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                            width="100%"
                            height="100%"
                            className="absolute inset-0"
                            style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }}
                        >
                            <defs>
                                {/* Enhanced Gradients for Realistic Pockets */}
                                <radialGradient id="redGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#ff4444" />
                                    <stop offset="50%" stopColor="#cc0000" />
                                    <stop offset="100%" stopColor="#800000" />
                                </radialGradient>

                                <radialGradient id="blackGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#444444" />
                                    <stop offset="50%" stopColor="#1a1a1a" />
                                    <stop offset="100%" stopColor="#000000" />
                                </radialGradient>

                                <radialGradient id="greenGradient" cx="50%" cy="30%">
                                    <stop offset="0%" stopColor="#00ff66" />
                                    <stop offset="50%" stopColor="#00aa44" />
                                    <stop offset="100%" stopColor="#006622" />
                                </radialGradient>

                                <linearGradient id="goldDivider" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFE55C" />
                                    <stop offset="50%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#B8860B" />
                                </linearGradient>

                                {/* Beveled Edge Effect */}
                                <filter id="bevelEffect">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                                    <feOffset dx="1" dy="1" result="offsetblur" />
                                    <feComponentTransfer>
                                        <feFuncA type="linear" slope="0.5" />
                                    </feComponentTransfer>
                                    <feMerge>
                                        <feMergeNode />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Render All Pockets */}
                            {WHEEL_ORDER.map((number, index) => {
                                const color = getColor(number);
                                const baseAngle = index * pocketAngle;
                                const centerAngle = baseAngle + pocketAngle / 2;

                                const startAngle = baseAngle * Math.PI / 180;
                                const endAngle = (baseAngle + pocketAngle) * Math.PI / 180;
                                const centerAngleRad = centerAngle * Math.PI / 180;

                                // Pocket vertices for trapezoid shape
                                const innerStartX = center + Math.cos(startAngle) * innerRadius;
                                const innerStartY = center + Math.sin(startAngle) * innerRadius;
                                const innerEndX = center + Math.cos(endAngle) * innerRadius;
                                const innerEndY = center + Math.sin(endAngle) * innerRadius;
                                const outerStartX = center + Math.cos(startAngle) * outerRadius;
                                const outerStartY = center + Math.sin(startAngle) * outerRadius;
                                const outerEndX = center + Math.cos(endAngle) * outerRadius;
                                const outerEndY = center + Math.sin(endAngle) * outerRadius;

                                const imageX = center + Math.cos(centerAngleRad) * imageRadius;
                                const imageY = center + Math.sin(centerAngleRad) * imageRadius;
                                const numberX = center + Math.cos(centerAngleRad) * numberRadius;
                                const numberY = center + Math.sin(centerAngleRad) * numberRadius;

                                const gradientId = color === 'red' ? 'redGradient' :
                                    color === 'green' ? 'greenGradient' : 'blackGradient';

                                const imagePath = getAnimalImagePath(number);

                                return (
                                    <g key={`${number}-${index}`}>
                                        {/* Pocket Background with Beveled Edges */}
                                        <path
                                            d={`M ${innerStartX} ${innerStartY}
                          L ${outerStartX} ${outerStartY}
                          L ${outerEndX} ${outerEndY}
                          L ${innerEndX} ${innerEndY}
                          Z`}
                                            fill={`url(#${gradientId})`}
                                            stroke="url(#goldDivider)"
                                            strokeWidth="3"
                                            strokeLinejoin="bevel"
                                            filter="url(#bevelEffect)"
                                            className={cn(
                                                "cursor-pointer transition-all duration-200",
                                                lastWinningNumber === number && !isSpinning &&
                                                "drop-shadow-[0_0_20px_rgba(255,215,0,0.9)]"
                                            )}
                                            onMouseEnter={() => setHoveredNumber(number)}
                                            onMouseLeave={() => setHoveredNumber(null)}
                                            onClick={() => handleNumberClick(number)}
                                        />

                                        {/* Gold Separator Lines */}
                                        <line
                                            x1={innerStartX}
                                            y1={innerStartY}
                                            x2={outerStartX}
                                            y2={outerStartY}
                                            stroke="url(#goldDivider)"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />

                                        {/* Animal Image with White Circle Background */}
                                        <g>
                                            {/* Outer glow ring */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="14"
                                                fill="none"
                                                stroke="#FFD700"
                                                strokeWidth="1.5"
                                                opacity="0.6"
                                                style={{
                                                    filter: 'drop-shadow(0 0 6px rgba(255, 77, 0, 0.36))'
                                                }}
                                            />

                                            {/* White background circle */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="12"
                                                fill="white"
                                                stroke="#FFD700"
                                                strokeWidth="2.5"
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                                }}
                                            />

                                            {/* Animal Image */}
                                            {imagePath && (
                                                <image
                                                    href={imagePath}
                                                    x={imageX - 15}
                                                    y={imageY - 15}
                                                    width="30"
                                                    height="30"
                                                    preserveAspectRatio="xMidYMid meet"
                                                    className="brightness-110 contrast-110"
                                                />
                                            )}

                                            {/* Inner decorative ring */}
                                            <circle
                                                cx={imageX}
                                                cy={imageY}
                                                r="24"
                                                fill="none"
                                                stroke="#ffb7001b"
                                                strokeWidth="1"
                                                strokeDasharray="3,3"
                                                opacity="0.5"
                                            />
                                        </g>

                                        {/* Number Circle */}
                                        <g>
                                            <circle
                                                cx={numberX}
                                                cy={numberY}
                                                r="12"
                                                fill="white"
                                                stroke={color === 'green' ? '#00aa44' : color === 'red' ? '#cc0000' : '#000'}
                                                strokeWidth="2.5"
                                                style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
                                                }}
                                            />

                                            <text
                                                x={numberX}
                                                y={numberY + 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="900"
                                                fill={color === 'green' ? '#006622' : color === 'red' ? '#990000' : '#000'}
                                                className="select-none"
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            >
                                                {number}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}

                            {/* Center Turret Base */}
                            <circle
                                cx={center}
                                cy={center}
                                r={innerRadius}
                                fill="url(#goldDivider)"
                                stroke="#2a1c01"
                                strokeWidth="8"
                                style={{
                                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6))'
                                }}
                            />

                            {/* Center Cross Pattern */}
                            <g>
                                <line
                                    x1={center - 40}
                                    y1={center}
                                    x2={center + 40}
                                    y2={center}
                                    stroke="#2a1c01"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                                <line
                                    x1={center}
                                    y1={center - 40}
                                    x2={center}
                                    y2={center + 40}
                                    stroke="#2a1c01"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />

                                {/* Central knob */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={20}
                                    fill="#2a1c01"
                                    style={{
                                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
                                    }}
                                />

                                {/* Highlight on knob */}
                                <circle
                                    cx={center - 5}
                                    cy={center - 5}
                                    r={8}
                                    fill="rgba(255, 215, 0, 0.3)"
                                />
                            </g>
                        </svg>
                    </div>

                    {/* Center Turret (Non-rotating) */}
                    <div
                        className="absolute inset-[40%] rounded-full flex items-center justify-center"
                        style={{
                            background: `
                radial-gradient(circle at 30% 30%, 
                  #ffa35cd0 0%, 
                  #ffb7001b 30%, 
                  #d4af3757 60%, 
                  #b8860b1b 100%
                )
              `,
                            boxShadow: `
                0 0 0 6px #2a1c01,
                0 10px 30px rgba(0, 0, 0, 0.7),
                inset 0 -8px 16px rgba(0, 0, 0, 0.4),
                inset 0 8px 16px rgba(255, 255, 255, 0.3)
              `,
                            transform: 'translateZ(20px)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {/* Turret Finial */}
                        <div
                            className="w-8 h-8 rounded-full"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #ffa35cd0, #ffb7001b)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)'
                            }}
                        />
                    </div>

                    {/* Winning Number Display - Centered Over Wheel */}


                    {/* Winning Number Display - Centered Over Wheel */}
                    <AnimatePresence>
                        {lastWinningNumber && !isSpinning && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                            >
                                <div
                                    className="relative rounded-xl md:rounded-2xl px-3 md:px-6 py-2 md:py-4 text-center pointer-events-auto"
                                    style={{
                                        background: `
                        linear-gradient(135deg, 
                            rgba(0, 0, 0, 0.95) 0%, 
                            rgba(26, 26, 26, 0.95) 100%
                        )
                    `,
                                        backdropFilter: 'blur(20px)',
                                        border: '2px md:3px solid',
                                        borderImage: 'linear-gradient(135deg, #FFD700, #D4AF37) 1',
                                        boxShadow: `
                        0 15px 40px rgba(0, 0, 0, 0.8),
                        inset 0 0 30px rgba(255, 215, 0, 0.15),
                        0 0 60px rgba(255, 215, 0, 0.3)
                    `
                                    }}
                                >
                                    <div className="flex items-center gap-2 md:gap-4">
                                        {/* Animal Image */}
                                        {getAnimalImagePath(lastWinningNumber) && (
                                            <div className="w-8 h-8 md:w-16 md:h-16 relative flex-shrink-0">
                                                <div
                                                    className="absolute inset-0 rounded-full"
                                                    style={{
                                                        background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                                                        animation: 'pulse 2s ease-in-out infinite'
                                                    }}
                                                />
                                                <img
                                                    src={getAnimalImagePath(lastWinningNumber)}
                                                    alt={`Animal ${lastWinningNumber}`}
                                                    className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(255,215,0,0.4)]"
                                                />
                                            </div>
                                        )}

                                        {/* Winning Number */}
                                        <div
                                            className={cn(
                                                "text-xl md:text-5xl font-black px-3 md:px-6 py-1.5 md:py-3 rounded-lg md:rounded-xl",
                                                "transition-all duration-300"
                                            )}
                                            style={{
                                                background: getColor(lastWinningNumber) === 'green'
                                                    ? 'linear-gradient(135deg, rgba(0, 170, 68, 0.4), rgba(0, 102, 34, 0.6))'
                                                    : getColor(lastWinningNumber) === 'red'
                                                        ? 'linear-gradient(135deg, rgba(204, 0, 0, 0.4), rgba(128, 0, 0, 0.6))'
                                                        : 'linear-gradient(135deg, rgba(68, 68, 68, 0.4), rgba(0, 0, 0, 0.6))',
                                                color: getColor(lastWinningNumber) === 'green' ? '#00ff66'
                                                    : getColor(lastWinningNumber) === 'red' ? '#ff4444' : '#ffffff',
                                                textShadow: '0 4px 20px rgba(0, 0, 0, 0.9), 0 0 30px currentColor',
                                                border: '2px solid',
                                                borderColor: getColor(lastWinningNumber) === 'green' ? '#00aa44'
                                                    : getColor(lastWinningNumber) === 'red' ? '#cc0000' : '#666'
                                            }}
                                        >
                                            {lastWinningNumber}
                                        </div>

                                        {/* Animal Name - NOW VISIBLE ON ALL SCREENS */}
                                        {getAnimalName(lastWinningNumber) && (
                                            <div className="text-left flex-shrink-0">
                                                <div className="text-[#FFD700] text-[7px] md:text-xs font-medium mb-0.5 md:mb-1 uppercase tracking-wider">
                                                    Winner
                                                </div>
                                                <div className="text-white text-xs md:text-lg font-bold leading-tight">
                                                    {getAnimalName(lastWinningNumber)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Roulette Ball */}
                <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        transform: `rotate(${ballRotation}deg)`,
                        opacity: ballOpacity,
                        transition: 'opacity 0.3s'
                    }}
                >
                    <div
                        className="absolute left-1/2"
                        style={{
                            top: `${50 - ballRadius}%`,
                            transform: `translate(-50%, -50%)`,
                        }}
                    >
                        <motion.div
                            className="relative"
                            animate={{
                                rotate: isSpinning ? 360 : 0,
                                scale: isSpinning ? [1, 1.15, 1] : 1
                            }}
                            transition={{
                                duration: 0.3,
                                repeat: isSpinning ? Infinity : 0,
                                ease: "linear"
                            }}
                        >
                            <div
                                className="w-4 h-4 md:w-6 md:h-6 rounded-full"
                                style={{
                                    background: `
                    radial-gradient(circle at 30% 30%, 
                      #ffffff 0%, 
                      #f0f0f0 40%, 
                      #d0d0d0 70%,
                      #a0a0a0 100%
                    )
                  `,
                                    boxShadow: `
                    0 0 10px md:0 0 20px rgba(255, 255, 255, 0.9),
                    inset 0 -1px md:-3px 3px md:6px rgba(0, 0, 0, 0.3),
                    inset 1px md:3px 1px md:3px 4px md:8px rgba(255, 255, 255, 0.8)
                  `,
                                    border: '1px md:2px solid rgba(255, 255, 255, 0.6)'
                                }}
                            >
                                {/* Highlight spot */}
                                <div
                                    className="absolute top-0.5 md:top-2 left-0.5 md:left-2 w-1.5 md:w-3 h-1.5 md:h-3 rounded-full"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        filter: 'blur(1px)'
                                    }}
                                />
                            </div>

                            {/* Ball glow */}
                            <div
                                className="absolute -inset-3 md:-inset-6 rounded-full -z-10"
                                style={{
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                                    filter: 'blur(4px md:8px)'
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Reflection Overlay */}
                <div
                    className="absolute inset-[25px] md:inset-[45px] rounded-full pointer-events-none z-30"
                    style={{
                        background: `
              radial-gradient(circle at 25% 25%, 
                rgba(255, 255, 255, 0.15) 0%, 
                transparent 50%
              )
            `,
                        mixBlendMode: 'overlay'
                    }}
                />
            </div>

            {/* Status Panel - Repositioned for Responsive */}

        </div>
    );
};
