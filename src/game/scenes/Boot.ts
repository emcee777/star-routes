// ============================================================
// Star Routes - Boot Scene
// Minimal setup, then go to Preloader
// ============================================================

import { Scene } from 'phaser';
import { COLORS } from '../config/constants';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);
        this.scene.start('Preloader');
    }
}
