// utils/AudioManager.ts
class AudioManager {
    private audioContext: AudioContext | null = null;
    private spinBuffer: AudioBuffer | null = null;
    private dropBuffer: AudioBuffer | null = null;
    private spinSource: AudioBufferSourceNode | null = null;
    private isLoaded = false;
    private hasUserInteraction = false;

    async init() {
        // Create AudioContext only once
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // If already loaded, skip
        if (this.isLoaded) return;

        try {
            // ✅ CORRECT PATH: /sounds/ (not ./public/sounds/)
            const [spinRes, dropRes] = await Promise.all([
                fetch('/sounds/ball_spin.mp3'),
                fetch('/sounds/ball_drop.mp3')
            ]);

            if (!spinRes.ok || !dropRes.ok) {
                throw new Error('Sound files not found');
            }

            const [spinArray, dropArray] = await Promise.all([
                spinRes.arrayBuffer(),
                dropRes.arrayBuffer()
            ]);

            [this.spinBuffer, this.dropBuffer] = await Promise.all([
                this.audioContext.decodeAudioData(spinArray),
                this.audioContext.decodeAudioData(dropArray)
            ]);

            this.isLoaded = true;
            console.log('AudioManager: Sounds loaded successfully');
        } catch (e) {
            console.warn('AudioManager: Failed to load sounds', e);
        }
    }

    // 👇 Call this on first user interaction (e.g., click anywhere)
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.hasUserInteraction = true; // 👈 CRITICAL!
    }

    playSpin() {
        // Ensure user has interacted
        if (!this.hasUserInteraction) return;

        if (!this.isLoaded || !this.audioContext || !this.spinBuffer) {
            return;
        }

        // Stop previous spin
        if (this.spinSource) {
            this.spinSource.stop();
        }

        this.spinSource = this.audioContext.createBufferSource();
        this.spinSource.buffer = this.spinBuffer;
        this.spinSource.loop = true;
        this.spinSource.connect(this.audioContext.destination);
        this.spinSource.start();
    }



    stopSpinAndPlayDrop() {
        if (!this.hasUserInteraction) return;

        if (!this.isLoaded || !this.audioContext || !this.dropBuffer) {
            return;
        }

        // Stop spin
        if (this.spinSource) {
            this.spinSource.stop();
            this.spinSource = null;
        }

        const dropSource = this.audioContext.createBufferSource();
        dropSource.buffer = this.dropBuffer;
        dropSource.connect(this.audioContext.destination);
        dropSource.start();
    }

    cleanup() {
        if (this.spinSource) {
            this.spinSource.stop();
            this.spinSource = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export const audioManager = new AudioManager();