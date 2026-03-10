import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const segments = [
    { label: '10% OFF', color: '#10b981' },
    { label: 'FREE SHIP', color: '#064e3b' },
    { label: '20% OFF', color: '#059669' },
    { label: 'NO WIN', color: '#111827' },
    { label: '50% OFF', color: '#10b981' },
    { label: 'MYSTERY', color: '#065f46' },
    { label: '5€ VOUCHER', color: '#34d399' },
    { label: 'NO WIN', color: '#1f2937' },
];

export default function WheelOfFortune({ onResult }) {
    const [isSpinning, setIsSpinning] = useState(false);
    const controls = useAnimation();

    const spin = async () => {
        if (isSpinning) return;
        setIsSpinning(true);

        const rounds = 5 + Math.floor(Math.random() * 5);
        const extraDegrees = Math.floor(Math.random() * 360);
        const totalDegrees = rounds * 360 + extraDegrees;

        await controls.start({
            rotate: totalDegrees,
            transition: { duration: 4, ease: [0.22, 1, 0.36, 1] },
        });

        // Calculate result
        const deg = extraDegrees % 360;
        const segmentWidth = 360 / segments.length;
        // Offset by 90 to match top arrow, and inverse because rotation is clockwise
        const winnerIndex = Math.floor(((360 - deg + 90) % 360) / segmentWidth);

        setIsSpinning(false);
        onResult(segments[winnerIndex]);
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* Pointer */}
            <div className="absolute -top-4 z-20 text-emerald-400">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21l-8-14h16l-8 14z" />
                </svg>
            </div>

            <motion.svg
                animate={controls}
                width="300"
                height="300"
                viewBox="0 0 100 100"
                className="wheel-svg"
            >
                {segments.map((s, i) => {
                    const angle = (360 / segments.length) * i;
                    const rotate = `rotate(${angle} 50 50)`;
                    const x2 = 50 + 45 * Math.cos((Math.PI * 2 * (angle + (360 / segments.length) / 2)) / 360);
                    const y2 = 50 + 45 * Math.sin((Math.PI * 2 * (angle + (360 / segments.length) / 2)) / 360);

                    return (
                        <g key={i} transform={rotate}>
                            <path
                                d="M50 50 L50 5 A45 45 0 0 1 85 20 Z"
                                fill={s.color}
                                stroke="#0f172a"
                                strokeWidth="0.5"
                                transform={`rotate(${-360 / segments.length / 2} 50 50)`}
                            />
                            <text
                                x="75"
                                y="50"
                                fill="white"
                                fontSize="3"
                                fontWeight="bold"
                                transform={`rotate(22.5 75 50)`}
                                textAnchor="middle"
                            >
                                {s.label}
                            </text>
                        </g>
                    );
                })}
                <circle cx="50" cy="50" r="4" fill="#10b981" />
            </motion.svg>

            <button
                onClick={spin}
                disabled={isSpinning}
                className="spin-button mt-8"
            >
                {isSpinning ? 'SPINNING...' : 'SPIN TO WIN'}
            </button>
        </div>
    );
}
