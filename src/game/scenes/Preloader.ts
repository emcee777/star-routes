// ============================================================
// Star Routes - Preloader Scene
// Loading bar, no external assets needed (procedural graphics)
// ============================================================

import { Scene } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Draw loading text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'STAR ROUTES', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Loading...', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Since we use procedural graphics, nothing to load
        // Proceed directly to MainMenu after a brief delay
        this.time.delayedCall(500, () => {
            this.scene.start('MainMenu');
        });
    }
}
