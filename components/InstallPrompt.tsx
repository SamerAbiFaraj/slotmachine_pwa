import React, { useEffect, useState } from 'react';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to notify the user they can add to home screen
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-500">
            <button
                onClick={handleInstallClick}
                className="
                    group relative
                    px-6 py-3 
                    rounded-full 
                    bg-neo-bg/90 backdrop-blur-xl 
                    border border-neo-gold/30
                    shadow-[0_0_20px_rgba(226,182,89,0.2)]
                    flex items-center gap-3
                    hover:scale-105 transition-all duration-300
                "
            >
                <div className="absolute inset-0 rounded-full bg-neo-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="
                    w-8 h-8 rounded-lg bg-neo-gold 
                    flex items-center justify-center 
                    text-black font-bold shadow-sm
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                </div>

                <div className="flex flex-col items-start">
                    <span className="text-neo-gold font-bold text-sm uppercase tracking-wider">Install App</span>
                    <span className="text-xs text-gray-400">Add to Home Screen</span>
                </div>
            </button>
        </div>
    );
};
