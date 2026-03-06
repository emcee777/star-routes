// ============================================================
// Star Routes - Main Menu Scene
// Title, New Game, Continue, ambient star background
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';

interface StarParticle {
    x: number;
    y: number;
    size: number;
    alpha: number;
    speed: number;
    graphic: GameObjects.Arc;
}

export class MainMenu extends Scene {
    private stars: StarParticle[] = [];
    private saveSystem: SaveSystem;

    constructor() {
        super('MainMenu');
        this.saveSystem = new SaveSystem();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Create ambient star background
        this.createStarfield();

        // Title
        this.add.text(GAME_WIDTH / 2, 160, 'STAR ROUTES', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Subtitle
        this.add.text(GAME_WIDTH / 2, 210, 'A Space Trading Simulation', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // New Game button
        this.createButton(GAME_WIDTH / 2, 340, 'NEW GAME', COLORS.positive, () => {
            this.scene.start('NewGame');
        });

        // Continue button (if save exists)
        if (this.saveSystem.hasSave('auto')) {
            this.createButton(GAME_WIDTH / 2, 400, 'CONTINUE', COLORS.textHighlight, () => {
                this.scene.start('StationScene', { loadSave: true });
            });
        }

        // Flavor text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Buy low. Sell high. Survive the void.', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            fontStyle: 'italic',
        }).setOrigin(0.5, 0.5);
    }

    private createStarfield(): void {
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const size = 0.5 + Math.random() * 2;
            const alpha = 0.2 + Math.random() * 0.6;
            const speed = 0.1 + Math.random() * 0.3;

            const starColor = [0xffffff, 0xaabbff, 0xffddaa, 0xffaaaa][Math.floor(Math.random() * 4)];
            const graphic = this.add.circle(x, y, size, starColor, alpha);

            this.stars.push({ x, y, size, alpha, speed, graphic });
        }
    }

    private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
        const width = 220;
        const height = 44;

        const bg = this.add.rectangle(x, y, width, height, color, 0.15);
        bg.setStrokeStyle(2, color, 0.6);

        const text = this.add.text(x, y, label, {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        bg.setInteractive();
        bg.on('pointerdown', onClick);
        bg.on('pointerover', () => {
            bg.setFillStyle(color, 0.3);
            text.setColor('#ffffff');
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(color, 0.15);
            text.setColor('#' + color.toString(16).padStart(6, '0'));
        });
    }

    update(_time: number, _delta: number): void {
        // Twinkle stars
        for (const star of this.stars) {
            star.alpha += Math.sin(star.speed * _time * 0.001) * 0.005;
            star.graphic.setAlpha(Math.max(0.1, Math.min(0.9, star.alpha)));
        }
    }
}
