// utils/AudioManager.ts
class AudioManager {
    private audioContext: AudioContext | null = null;
    private spinBuffer: AudioBuffer | null = null;
    private dropBuffer: AudioBuffer | null = null;
    private spinSource: AudioBufferSourceNode | null = null;
    private isLoaded = false;

    async init() {
        // Only create AudioContext on user interaction (required by browsers)
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        try {
            // Load both sounds in parallel
            const [spinRes, dropRes] = await Promise.all([
                fetch('/sounds/ball_spin.mp3'),
                fetch('/sounds/ball_drop.mp3')
            ]);

            const [spinArray, dropArray] = await Promise.all([
                spinRes.arrayBuffer(),
                dropRes.arrayBuffer()
            ]);

            [this.spinBuffer, this.dropBuffer] = await Promise.all([
                this.audioContext.decodeAudioData(spinArray),
                this.audioContext.decodeAudioData(dropArray)
            ]);

            this.isLoaded = true;
        } catch (e) {
            console.warn("Audio failed to load:", e);
        }
    }

    playSpin() {
        if (!this.isLoaded || !this.audioContext || !this.spinBuffer) return;

        // Stop previous spin if playing
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
        if (!this.isLoaded || !this.audioContext || !this.dropBuffer) return;

        // Stop spin
        if (this.spinSource) {
            this.spinSource.stop();
            this.spinSource = null;
        }

        // Play drop sound immediately
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