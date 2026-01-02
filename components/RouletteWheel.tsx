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
    initialVelocity: 18,
    decayConstant: 0.35,
    outerRadius: 49,
    pocketRadius: 37,
    deflectorCount: 8,
    deflectorMagnitude: 4,
    rattleCount: 3,
    totalDuration: 8000,

    // Phase timing
    outerRimDuration: 0.6,
    spiralDuration: 0.25,
    settleDuration: 0.15,
};

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

const calculateVelocity = (t: number, config: typeof PHYSICS_CONFIG): number => {
    const { initialVelocity, decayConstant, totalDuration } = config;
    const normalizedTime = t / totalDuration;
    return initialVelocity * Math.exp(-decayConstant * normalizedTime * 10);
};

const calculateAngleTraveled = (t: number, config: typeof PHYSICS_CONFIG): number => {
    const { initialVelocity, decayConstant, totalDuration } = config;
    const normalizedTime = t / totalDuration;
    const k = decayConstant * 10;
    const angleInRotations = (initialVelocity / k) * (1 - Math.exp(-k * normalizedTime));
    return angleInRotations * 360;
};

const applyDeflectorHit = (
    baseAngle: number,
    time: number,
    config: typeof PHYSICS_CONFIG,
    rng: SeededRandom
): number => {
    const { deflectorCount, deflectorMagnitude, totalDuration, outerRimDuration } = config;

    if (time > totalDuration * outerRimDuration) {
        return baseAngle;
    }

    const currentRotations = baseAngle / 360;
    const deflectorInterval = 1 / deflectorCount;
    const distanceToDeflector =
        (currentRotations % deflectorInterval) / deflectorInterval;

    if (distanceToDeflector < 0.05 || distanceToDeflector > 0.95) {
        const hitStrength = (rng.next() - 0.5) * 2;
        const deflection = hitStrength * deflectorMagnitude;
        return baseAngle + deflection;
    }

    return baseAngle;
};

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
    const amplitude = 8;

    const rattle =
        amplitude *
        Math.exp(-damping * settleProgress) *
        Math.sin(frequency * settleProgress);

    return rattle;
};

const calculateBallRadius = (time: number, config: typeof PHYSICS_CONFIG): number => {
    const {
        totalDuration,
        outerRimDuration,
        spiralDuration,
        outerRadius,
        pocketRadius,
    } = config;
    const outerRimEnd = totalDuration * outerRimDuration;
    const spiralEnd = totalDuration * (outerRimDuration + spiralDuration);

    if (time < outerRimEnd) {
        return outerRadius;
    } else if (time < spiralEnd) {
        const spiralProgress = (time - outerRimEnd) / (spiralEnd - outerRimEnd);
        const easeProgress = 1 - Math.pow(1 - spiralProgress, 3);
        return outerRadius - (outerRadius - pocketRadius) * easeProgress;
    } else {
        return pocketRadius;
    }
};

const POCKET_COUNT = 38;
const BALL_LANDING_POSITION = 90;

export const RouletteWheel: React.FC<Props> = ({
    phase,
    winningNumber,
    onBetPlaced,
}) => {
    const [wheelRotation, setWheelRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);
    const [ballRadius, setBallRadius] = useState(49);
    const [ballOpacity, setBallOpacity] = useState(0);
    const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastWinningNumber, setLastWinningNumber] = useState<string | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [alignmentDebug, setAlignmentDebug] = useState<string>('');
    const [spinDirection, setSpinDirection] = useState<'clockwise' | 'counterclockwise'>(
        'clockwise'
    );

    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const getColor = (number: string): 'red' | 'black' | 'green' => {
        return getNumberColor(number);
    };

    // Idle animation / spin sequence trigger
    useEffect(() => {
        if (phase === GamePhase.WAITING_FOR_BETS) {
            cancelAnimationFrame(requestRef.current);
            setIsSpinning(false);

            const idleSpin = () => {
                setWheelRotation((prev) => {
                    const next = prev + 0.015;
                    return next >= 360 ? next - 360 : next;
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

    const startSpinSequence = (
        targetNumber: string,
        direction: 'clockwise' | 'counterclockwise'
    ) => {
        startTimeRef.current = performance.now();
        setBallOpacity(1);

        const targetIndex = WHEEL_ORDER.indexOf(targetNumber);
        if (targetIndex === -1) {
            console.error('Invalid target number:', targetNumber);
            return;
        }

        const anglePerPocket = 360 / POCKET_COUNT;
        const targetPocketAngle = (targetIndex + 0.5) * anglePerPocket;

        const startWheelAngle = wheelRotation % 360;
        const wheelIsClockwise = direction === 'clockwise';
        const wheelDirMultiplier = wheelIsClockwise ? 1 : -1;

        const wheelExtraRotations = 5;
        const totalWheelRotation = 360 * wheelExtraRotations * wheelDirMultiplier;
        const finalWheelAngle = startWheelAngle + totalWheelRotation;

        const ballDirMultiplier = -wheelDirMultiplier;
        const totalBallAngle = calculateAngleTraveled(
            PHYSICS_CONFIG.totalDuration,
            PHYSICS_CONFIG
        );

        const desiredFinalBallAngle =
            finalWheelAngle + targetPocketAngle + BALL_LANDING_POSITION;
        const ballStartAngle = desiredFinalBallAngle - totalBallAngle * ballDirMultiplier;

        const rng = new SeededRandom(targetIndex * 1000 + (Date.now() % 1000));

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;
            const progress = Math.min(elapsed / PHYSICS_CONFIG.totalDuration, 1);

            const wheelEase = 1 - Math.pow(1 - progress, 3);
            const currentWheelAngle = startWheelAngle + totalWheelRotation * wheelEase;
            setWheelRotation(currentWheelAngle);

            let ballAngleTraveled = calculateAngleTraveled(elapsed, PHYSICS_CONFIG);
            let currentBallAngle =
                ballStartAngle + ballAngleTraveled * ballDirMultiplier;

            currentBallAngle =
                applyDeflectorHit(
                    Math.abs(ballAngleTraveled),
                    elapsed,
                    PHYSICS_CONFIG,
                    rng
                ) *
                ballDirMultiplier +
                ballStartAngle;

            const rattleOffset = applyPocketRattle(
                elapsed,
                desiredFinalBallAngle,
                PHYSICS_CONFIG
            );
            currentBallAngle += rattleOffset;

            const currentBallRadius = calculateBallRadius(elapsed, PHYSICS_CONFIG);

            setBallRotation(currentBallAngle);
            setBallRadius(currentBallRadius);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                setSelectedNumber(targetNumber);
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

    const wheelSize = 1200;
    const center = wheelSize / 2;
    const outerRadius = center - 10;
    const innerRadius = 250;
    const pocketAngle = 360 / POCKET_COUNT;
    const imageRadius = outerRadius - 60;
    const numberRadius = imageRadius - 65;

    return (
        <div className="relative flex items-center justify-center w-full h-full p-0">
            {/* Main Wheel Container */}
            <div
                className="relative wheel-container"
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center center',
                }}
            >
                {/* Outer wood / metal frame */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `
              radial-gradient(circle at 30% 20%,
                rgba(255,255,255,0.18) 0%,
                transparent 45%
              ),
              conic-gradient(
                from 0deg,
                #4d2416,
                #7a3f1f,
                #a85a26,
                #70301c,
                #4d2416
              )
            `,
                        boxShadow: `
              0 18px 50px rgba(0,0,0,0.9),
              inset 0 0 0 2px rgba(255,255,255,0.06),
              inset 0 10px 25px rgba(0,0,0,0.75)
            `,
                    }}
                />

                {/* Inner bowl shadow */}
                <div
                    className="absolute inset-[8px] rounded-full"
                    style={{
                        background: `
              radial-gradient(circle at center,
                transparent 0%,
                transparent 40%,
                rgba(0,0,0,0.6) 74%,
                rgba(0,0,0,0.9) 100%
              )
            `,
                        boxShadow: 'inset 0 0 70px rgba(0,0,0,0.95)',
                    }}
                />

                {/* Inner bowl (dark, glossy) */}
                <div
                    className="absolute inset-[20px] md:inset-[26px] rounded-full overflow-hidden"
                    style={{
                        background: `
              radial-gradient(circle at 35% 25%,
                #202020 0%,
                #050505 40%,
                #000000 72%,
                #000000 100%
              )
            `,
                        boxShadow: `
              inset 0 18px 45px rgba(0,0,0,0.95),
              inset 0 -6px 25px rgba(243,198,32,0.12)
            `,
                        transform: 'rotateX(15deg)',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Rotating wheel pockets */}
                    <div
                        className="absolute inset-[28px] md:inset-[34px] rounded-full"
                        style={{
                            background: `
                radial-gradient(circle at 30% 20%,
                  rgba(255,255,255,0.09) 0%,
                  transparent 40%
                ),
                radial-gradient(circle at center,
                  #111111 0%,
                  #1a1a1a 35%,
                  #050505 70%
                )
              `,
                            boxShadow: `
                inset 0 0 22px rgba(0,0,0,0.85),
                0 0 18px rgba(0,0,0,0.6)
              `,
                        }}
                    >
                        <div
                            className="absolute inset-[18px]"
                            style={{
                                transform: `rotate(${wheelRotation}deg)`,
                                transition: isSpinning ? 'none' : 'transform 0.05s linear',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            <svg
                                viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                                width="100%"
                                height="100%"
                                className="absolute inset-0"
                                style={{
                                    filter:
                                        'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
                                }}
                            >
                                <defs>
                                    {/* Rich pocket gradients */}
                                    <radialGradient id="redGradient" cx="50%" cy="30%">
                                        <stop offset="0%" stopColor="#ff6b6b" />
                                        <stop offset="45%" stopColor="#d01928" />
                                        <stop offset="100%" stopColor="#8a0006" />
                                    </radialGradient>
                                    <radialGradient id="blackGradient" cx="50%" cy="35%">
                                        <stop offset="0%" stopColor="#5a5a5a" />
                                        <stop offset="45%" stopColor="#151515" />
                                        <stop offset="100%" stopColor="#000000" />
                                    </radialGradient>
                                    <radialGradient id="greenGradient" cx="50%" cy="30%">
                                        <stop offset="0%" stopColor="#73ffba" />
                                        <stop offset="45%" stopColor="#0d8a46" />
                                        <stop offset="100%" stopColor="#015225" />
                                    </radialGradient>

                                    {/* Metallic ring */}
                                    <radialGradient id="goldRing" cx="50%" cy="30%">
                                        <stop offset="0%" stopColor="#fff8d9" />
                                        <stop offset="40%" stopColor="#f7cf4a" />
                                        <stop offset="75%" stopColor="#c7921a" />
                                        <stop offset="100%" stopColor="#5b3b0d" />
                                    </radialGradient>

                                    {/* Inner dish */}
                                    <radialGradient id="innerDish" cx="50%" cy="40%">
                                        <stop offset="0%" stopColor="#dddddd" />
                                        <stop offset="55%" stopColor="#b5b5b5" />
                                        <stop offset="100%" stopColor="#666666" />
                                    </radialGradient>
                                </defs>

                                {/* Outer metallic ring */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={outerRadius}
                                    fill="url(#goldRing)"
                                    stroke="rgba(0,0,0,0.8)"
                                    strokeWidth={6}
                                />

                                {/* Pockets */}
                                {WHEEL_ORDER.map((num, index) => {
                                    const startAngle = index * pocketAngle;
                                    const endAngle = startAngle + pocketAngle;
                                    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

                                    const startRad = (startAngle * Math.PI) / 180;
                                    const endRad = (endAngle * Math.PI) / 180;

                                    const outerStartX = center + outerRadius * Math.cos(startRad);
                                    const outerStartY = center + outerRadius * Math.sin(startRad);
                                    const outerEndX = center + outerRadius * Math.cos(endRad);
                                    const outerEndY = center + outerRadius * Math.sin(endRad);

                                    const innerStartX = center + innerRadius * Math.cos(startRad);
                                    const innerStartY = center + innerRadius * Math.sin(startRad);
                                    const innerEndX = center + innerRadius * Math.cos(endRad);
                                    const innerEndY = center + innerRadius * Math.sin(endRad);

                                    const pathData = `
                    M ${outerStartX} ${outerStartY}
                    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
                    L ${innerEndX} ${innerEndY}
                    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
                    Z
                  `;

                                    const color = getColor(num);
                                    const fill =
                                        color === 'red'
                                            ? 'url(#redGradient)'
                                            : color === 'black'
                                                ? 'url(#blackGradient)'
                                                : 'url(#greenGradient)';

                                    const isWinning = num === winningNumber;

                                    return (
                                        <g key={num}>
                                            <path
                                                d={pathData}
                                                fill={fill}
                                                stroke="rgba(0,0,0,0.8)"
                                                strokeWidth={2}
                                                style={{
                                                    filter: isWinning
                                                        ? 'drop-shadow(0 0 12px rgba(243,198,32,0.9))'
                                                        : 'none',
                                                }}
                                            />
                                        </g>
                                    );
                                })}

                                {/* Inner metallic ring bordering pockets */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={innerRadius}
                                    fill="url(#goldRing)"
                                    stroke="rgba(0,0,0,0.9)"
                                    strokeWidth={4}
                                />

                                {/* Number ring */}
                                {WHEEL_ORDER.map((num, index) => {
                                    const angle = (index + 0.5) * pocketAngle;
                                    const rad = (angle * Math.PI) / 180;

                                    const textX = center + numberRadius * Math.cos(rad);
                                    const textY = center + numberRadius * Math.sin(rad);

                                    const color = getColor(num);
                                    const textColor =
                                        color === 'red'
                                            ? '#ffdfdf'
                                            : color === 'black'
                                                ? '#f5f5f5'
                                                : '#f5ffe5';

                                    return (
                                        <text
                                            key={`num-${num}`}
                                            x={textX}
                                            y={textY}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill={textColor}
                                            fontSize={34}
                                            fontFamily="'Cinzel', system-ui, serif"
                                            fontWeight={700}
                                            transform={`rotate(${angle + 90} ${textX} ${textY})`}
                                            style={{
                                                textShadow:
                                                    '0 0 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                                            }}
                                        >
                                            {num}
                                        </text>
                                    );
                                })}

                                {/* Animal images ring */}
                                {WHEEL_ORDER.map((num, index) => {
                                    const angle = (index + 0.5) * pocketAngle;
                                    const rad = (angle * Math.PI) / 180;

                                    const imgX = center + imageRadius * Math.cos(rad);
                                    const imgY = center + imageRadius * Math.sin(rad);

                                    const imagePath = getAnimalImagePath(num);
                                    if (!imagePath) return null;

                                    const imgSize = 70;

                                    return (
                                        <image
                                            key={`img-${num}`}
                                            href={imagePath}
                                            x={imgX - imgSize / 2}
                                            y={imgY - imgSize / 2}
                                            width={imgSize}
                                            height={imgSize}
                                            preserveAspectRatio="xMidYMid slice"
                                            style={{
                                                filter:
                                                    'drop-shadow(0 0 6px rgba(0,0,0,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
                                            }}
                                        />
                                    );
                                })}

                                {/* Inner dish */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={innerRadius - 40}
                                    fill="url(#innerDish)"
                                    stroke="rgba(0,0,0,0.65)"
                                    strokeWidth={3}
                                    style={{
                                        filter:
                                            'drop-shadow(0 4px 10px rgba(0,0,0,0.8)) inset 0 0 16px rgba(0,0,0,0.85)',
                                    }}
                                />

                                {/* Center cap */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={70}
                                    fill="url(#goldRing)"
                                    stroke="rgba(0,0,0,0.8)"
                                    strokeWidth={3}
                                    style={{
                                        filter:
                                            'drop-shadow(0 0 15px rgba(243,198,32,0.8)) inset 0 0 10px rgba(0,0,0,0.9)',
                                    }}
                                />
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={28}
                                    fill="rgba(0,0,0,0.9)"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth={2}
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Ball */}
                <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        transform: `rotate(${ballRotation}deg)`,
                        opacity: ballOpacity,
                        transition: 'opacity 0.3s',
                    }}
                >
                    <div
                        className="absolute left-1/2"
                        style={{
                            top: `${50 - ballRadius}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '3.5%',
                            aspectRatio: '1/1',
                        }}
                    >
                        <motion.div
                            className="relative w-full h-full"
                            animate={{
                                rotate: isSpinning ? 360 : 0,
                                scale: isSpinning ? [1, 1.15, 1] : 1,
                            }}
                            transition={{
                                duration: 0.3,
                                repeat: isSpinning ? Infinity : 0,
                                ease: 'linear',
                            }}
                        >
                            <div
                                className="w-full h-full rounded-full"
                                style={{
                                    background: `
                    radial-gradient(circle at 30% 30%,
                      #ffffff 0%,
                      #f5f5f5 40%,
                      #d0d0d0 70%,
                      #a0a0a0 100%
                    )
                  `,
                                    boxShadow: `
                    0 0 10px rgba(255,255,255,0.9),
                    inset 0 -3px 6px rgba(0,0,0,0.35),
                    inset 3px 3px 8px rgba(255,255,255,0.85)
                  `,
                                    border: '1px solid rgba(255,255,255,0.6)',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full"
                                    style={{
                                        background: 'rgba(255,255,255,0.95)',
                                        filter: 'blur(1px)',
                                    }}
                                />
                            </div>
                            <div
                                className="absolute -inset-[50%] rounded-full -z-10"
                                style={{
                                    background:
                                        'radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 70%)',
                                    filter: 'blur(8px)',
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Reflection / gloss on bowl */}
                <div
                    className="absolute inset-[32px] md:inset-[50px] rounded-full pointer-events-none z-30"
                    style={{
                        background: `
              radial-gradient(circle at 22% 18%,
                rgba(255,255,255,0.22) 0%,
                rgba(255,255,255,0.08) 18%,
                transparent 55%
              )
            `,
                        mixBlendMode: 'screen',
                    }}
                />
            </div>
        </div>
    );
};
