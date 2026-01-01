// utils/AudioManager.ts
class AudioManager {
    private audioContext: AudioContext | null = null;
    private spinBuffer: AudioBuffer | null = null;
    private dropBuffer: AudioBuffer | null = null;
    private winBuffer: AudioBuffer | null = null;
    private chipBuffer: AudioBuffer | null = null;
    private spinSource: AudioBufferSourceNode | null = null;
    private isLoaded = false;
    private hasUserInteraction = false;

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.isLoaded) return;

        try {
            // ✅ ALL lowercase .mp3
            const [spinRes, dropRes, winRes, chipRes] = await Promise.all([
                fetch('/sounds/ball_spin.mp3'),
                fetch('/sounds/ball_drop.mp3'),
                fetch('/sounds/win.mp3'),
                fetch('/sounds/chip_place.mp3')
            ]);

            // ✅ Check all responses
            if (!spinRes.ok || !dropRes.ok || !winRes.ok || !chipRes.ok) {
                console.error('🔇 Audio load failed', {
                    spin: spinRes.status,
                    drop: dropRes.status,
                    win: winRes.status,
                    chip: chipRes.status
                });
                return;
            }

            // ✅ Decode all buffers in parallel
            const [spinArray, dropArray, winArray, chipArray] = await Promise.all([
                spinRes.arrayBuffer(),
                dropRes.arrayBuffer(),
                winRes.arrayBuffer(),
                chipRes.arrayBuffer()
            ]);

            [this.spinBuffer, this.dropBuffer, this.winBuffer, this.chipBuffer] = await Promise.all([
                this.audioContext.decodeAudioData(spinArray),
                this.audioContext.decodeAudioData(dropArray),
                this.audioContext.decodeAudioData(winArray),
                this.audioContext.decodeAudioData(chipArray)
            ]);

            this.isLoaded = true;
            console.log('✅ All sounds loaded');
        } catch (e) {
            console.error('🔇 Audio init error:', e);
        }
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.hasUserInteraction = true;
    }

    playSpin() {
        if (!this.hasUserInteraction || !this.isLoaded || !this.spinBuffer) return;
        if (this.spinSource) this.spinSource.stop();
        this.spinSource = this.audioContext.createBufferSource();
        this.spinSource.buffer = this.spinBuffer;
        this.spinSource.loop = true;
        this.spinSource.connect(this.audioContext.destination);
        this.spinSource.start();
    }

    stopSpinAndPlayDrop() {
        if (!this.hasUserInteraction || !this.isLoaded || !this.dropBuffer) return;
        if (this.spinSource) {
            this.spinSource.stop();
            this.spinSource = null;
        }
        const dropSource = this.audioContext.createBufferSource();
        dropSource.buffer = this.dropBuffer;
        dropSource.connect(this.audioContext.destination);
        dropSource.start();
    }

    playWinSound() {
        if (!this.hasUserInteraction) {
            console.warn('🔇 Win sound blocked: no user interaction');
            return;
        }
        if (!this.winBuffer) {
            console.warn('🔇 Win sound blocked: buffer not loaded');
            return;
        }

        console.log('▶️ Win sound playing');
        const source = this.audioContext.createBufferSource();
        source.buffer = this.winBuffer;
        source.connect(this.audioContext.destination);
        source.start();

    }

    // Add this inside AudioManager class
    get isReady() {
        return this.hasUserInteraction && this.isLoaded;
    }

    playChipPlace() {
        //if (!this.hasUserInteraction || !this.chipBuffer) return;
        if (!this.hasUserInteraction) {
            console.warn('🔇 Chip place sound blocked: no user interaction');
            return;
        }
        if (!this.chipBuffer) {
            console.warn('🔇 Chip place sound blocked: buffer not loaded');
            return;
        }


        const source = this.audioContext.createBufferSource();
        source.buffer = this.chipBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
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

    // Play spin with spatial effect
    playSpinSpatial(angle: number) {
        const source = this.audioContext.createBufferSource();
        const panner = this.audioContext.createPanner();

        source.buffer = this.spinBuffer;
        source.loop = true;

        // Update position based on wheel angle
        const x = Math.cos(angle);
        const y = 0;
        const z = Math.sin(angle);
        panner.setPosition(x, y, z);

        source.connect(panner);
        panner.connect(this.audioContext.destination);
        source.start();
    }
}

export const audioManager = new AudioManager();