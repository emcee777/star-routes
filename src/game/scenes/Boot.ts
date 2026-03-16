// ============================================================
// Star Routes - Boot Scene
// Minimal setup, init audio, then go to Preloader
// ============================================================

import { Scene } from 'phaser';
import { COLORS } from '../config/constants';
import { AudioManager } from '../audio/AudioManager';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Initialize audio system early
        AudioManager.init();

        this.scene.start('Preloader');
    }
}
