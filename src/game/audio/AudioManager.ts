// ============================================================
// Star Routes - Audio Manager
// Howler.js-based audio skeleton for all game sound slots.
// Real audio files can be dropped into public/sfx/ later.
// Each slot has a placeholder tone synthesized via WebAudio
// so the hooks fire silently until assets are added.
// ============================================================

import { Howl, Howler } from 'howler';

export type SoundSlot =
    | 'engineThrust'     // looping ambient engine hum
    | 'tradeComplete'    // ka-ching when deal closes
    | 'combatHit'        // impact when taking damage
    | 'combatMiss'       // whoosh when attack misses
    | 'shieldBlock'      // energy deflect on shield absorb
    | 'crewHire'         // welcome aboard
    | 'eventTrigger'     // alert on random event
    | 'warpJump'         // sci-fi woosh on warp
    | 'dockStation'      // metallic clank on docking
    | 'navSelect';       // UI click on star/route select

interface SoundEntry {
    howl: Howl | null;
    volume: number;
    loop: boolean;
    stub: boolean;
}

// Synthesize a short tone via PCM WAV data URL as an audible stub
function synthToneDataUrl(
    freq: number,
    durationSec: number,
    type: 'sine' | 'square' | 'sawtooth' = 'sine'
): string {
    try {
        const sampleRate = 22050;
        const numSamples = Math.floor(sampleRate * durationSec);
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        const writeStr = (off: number, s: string) => {
            for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, numSamples * 2, true);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const attack = Math.min(1, t * 30);
            const decay = Math.max(0, 1 - t / durationSec);
            const envelope = attack * decay;
            let sample = 0;
            if (type === 'square') {
                sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.8 : -0.8;
            } else if (type === 'sawtooth') {
                sample = (2 * ((freq * t) % 1) - 1) * 0.7;
            } else {
                sample = Math.sin(2 * Math.PI * freq * t) * 0.7
                    + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2
                    + Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
            }
            const val = Math.floor(sample * envelope * 10000);
            view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, val)), true);
        }

        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return 'data:audio/wav;base64,' + btoa(binary);
    } catch (_) {
        return '';
    }
}

class AudioManagerClass {
    private sounds: Map<SoundSlot, SoundEntry> = new Map();
    private masterVolume: number = 0.7;
    private sfxVolume: number = 0.7;
    private musicVolume: number = 0.5;
    private initialized: boolean = false;
    private muted: boolean = false;
    private preMuteVolume: number = 0.7;

    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        const defs: Array<{
            slot: SoundSlot;
            src?: string;
            volume: number;
            loop: boolean;
            freq: number;
            dur: number;
            wave?: 'sine' | 'square' | 'sawtooth';
        }> = [
            { slot: 'engineThrust', volume: 0.20, loop: true,  freq: 80,  dur: 1.0, wave: 'sawtooth' },
            { slot: 'tradeComplete',volume: 0.55, loop: false, freq: 880, dur: 0.4, wave: 'sine'     },
            { slot: 'combatHit',    volume: 0.65, loop: false, freq: 150, dur: 0.3, wave: 'square'   },
            { slot: 'combatMiss',   volume: 0.35, loop: false, freq: 440, dur: 0.2, wave: 'sawtooth' },
            { slot: 'shieldBlock',  volume: 0.45, loop: false, freq: 660, dur: 0.3, wave: 'sine'     },
            { slot: 'crewHire',     volume: 0.45, loop: false, freq: 523, dur: 0.4, wave: 'sine'     },
            { slot: 'eventTrigger', volume: 0.50, loop: false, freq: 330, dur: 0.5, wave: 'sine'     },
            { slot: 'warpJump',     volume: 0.55, loop: false, freq: 220, dur: 0.8, wave: 'sawtooth' },
            { slot: 'dockStation',  volume: 0.45, loop: false, freq: 110, dur: 0.4, wave: 'square'   },
            { slot: 'navSelect',    volume: 0.25, loop: false, freq: 660, dur: 0.1, wave: 'sine'     },
        ];

        for (const def of defs) {
            // Use real file if src provided, else synth stub
            const src = def.src ?? synthToneDataUrl(def.freq, def.dur, def.wave ?? 'sine');
            const isStub = !def.src;

            if (!src) {
                this.sounds.set(def.slot, { howl: null, volume: def.volume, loop: def.loop, stub: true });
                continue;
            }

            const effectiveVolume = def.volume
                * (def.loop ? this.musicVolume : this.sfxVolume)
                * this.masterVolume;

            const howl = new Howl({
                src: [src],
                volume: effectiveVolume,
                loop: def.loop,
                html5: false,
                preload: true,
            });

            this.sounds.set(def.slot, { howl, volume: def.volume, loop: def.loop, stub: isStub });
        }
    }

    /** Play a sound slot. Looping sounds won't double-stack. */
    play(slot: SoundSlot): void {
        if (!this.initialized) this.init();
        const entry = this.sounds.get(slot);
        if (!entry?.howl) return;
        if (entry.loop) {
            if (!entry.howl.playing()) entry.howl.play();
        } else {
            entry.howl.play();
        }
    }

    stop(slot: SoundSlot): void {
        this.sounds.get(slot)?.howl?.stop();
    }

    pause(slot: SoundSlot): void {
        this.sounds.get(slot)?.howl?.pause();
    }

    stopAll(): void {
        this.sounds.forEach(entry => entry.howl?.stop());
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.muted) {
            this.preMuteVolume = this.masterVolume;
            Howler.volume(0);
        } else {
            Howler.volume(this.preMuteVolume);
        }
        return this.muted;
    }

    get isMuted(): boolean {
        return this.muted;
    }

    setMasterVolume(v: number): void {
        this.masterVolume = Math.max(0, Math.min(1, v));
        if (!this.muted) {
            Howler.volume(this.masterVolume);
        }
    }

    setSFXVolume(v: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        this.sounds.forEach((entry) => {
            if (!entry.loop && entry.howl) {
                entry.howl.volume(entry.volume * this.sfxVolume * this.masterVolume);
            }
        });
    }

    setMusicVolume(v: number): void {
        this.musicVolume = Math.max(0, Math.min(1, v));
        this.sounds.forEach((entry) => {
            if (entry.loop && entry.howl) {
                entry.howl.volume(entry.volume * this.musicVolume * this.masterVolume);
            }
        });
    }
}

// Singleton export
export const AudioManager = new AudioManagerClass();
