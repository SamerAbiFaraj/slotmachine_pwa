import React, { useEffect, useState } from 'react';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsStandalone(isStandaloneMode);
            if (isStandaloneMode) {
                setIsVisible(false);
            }
        };

        checkStandalone();

        // Listen for the prompt event
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not already installed (double check)
            if (!isStandalone) {
                setIsVisible(true);
            }
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsVisible(false);
            setIsStandalone(true);
            console.log('PWA was installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for user choice
        const choiceResult = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${choiceResult.outcome}`);

        // We can only use the prompt once
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible || isStandalone) return null;

    return (
        <div className="fixed bottom-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-500">
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
