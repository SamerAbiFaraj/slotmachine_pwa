import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone } from 'lucide-react';

export const OrientationOverlay: React.FC = () => {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            // Check if device is mobile or tablet and in portrait mode
            const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const portrait = window.innerHeight > window.innerWidth;
            setIsPortrait(isMobileOrTablet && portrait);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    return (
        <AnimatePresence>
            {isPortrait && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-neo-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 90, 90, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 1
                        }}
                        className="mb-8"
                    >
                        <Smartphone className="w-24 h-24 text-neo-gold" strokeWidth={1.5} />
                    </motion.div>

                    <h2 className="font-display font-bold text-3xl text-white mb-4 tracking-wider uppercase">
                        Rotate Device
                    </h2>
                    <p className="text-gray-400 max-w-xs leading-relaxed">
                        For the best experience, please rotate your device to <span className="text-neo-gold font-bold">Landscape View</span>.
                    </p>

                    <div className="mt-12 w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-neo-gold"
                            animate={{ x: [-64, 64] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
