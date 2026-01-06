import React, { useEffect, useRef } from 'react';

// Simple lightning strike renderer on a canvas
interface Props {
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    onComplete: () => void;
    color?: string;
}

export const LightningBolt: React.FC<Props> = ({
    startPos,
    endPos,
    onComplete,
    color = "#fcd34d"
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to full window
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let segments: { x: number; y: number }[] = [];
        const iterations = 5;
        const offset = 50;

        // Generate lightning path
        segments.push(startPos);
        segments.push(endPos);

        for (let i = 0; i < iterations; i++) {
            const newSegments: { x: number; y: number }[] = [];
            for (let j = 0; j < segments.length - 1; j++) {
                const start = segments[j];
                const end = segments[j + 1];
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                const normal = Math.random() < 0.5 ? -1 : 1;
                const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const curOffset = Math.max(offset / (i + 1), 5);

                newSegments.push(start);
                newSegments.push({
                    x: midX + (Math.random() - 0.5) * curOffset * dist / 200, // Perpendicular randomness
                    y: midY + (Math.random() - 0.5) * curOffset * dist / 200
                });
            }
            newSegments.push(segments[segments.length - 1]);
            segments = newSegments;
        }

        // Animation Loop
        let life = 1.0;
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (life <= 0) {
                onComplete();
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3 * life;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;

            ctx.moveTo(segments[0].x, segments[0].y);
            for (let k = 1; k < segments.length; k++) {
                ctx.lineTo(segments[k].x, segments[k].y);
            }
            ctx.stroke();

            life -= 0.1; // Fade out speed
            requestAnimationFrame(animate);
        };

        animate();

    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[150]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
