// ============================================================
// Star Routes - Victory Scene
// Reached trading empire goal. Final stats and celebration.
// Dramatic white fade-in from warp transition.
// ============================================================

import { Scene } from 'phaser';
import { GameState } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, VICTORY_CREDITS, VICTORY_SYSTEMS, VICTORY_TRADES } from '../config/constants';

export class VictoryScene extends Scene {
    private gameState: GameState | null = null;

    constructor() {
        super('VictoryScene');
    }

    init(data: { gameState?: GameState }): void {
        this.gameState = data.gameState ?? null;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(0x0a0a1a);

        // Dramatic white flash fade-in (triumphant arrival)
        this.cameras.main.fadeIn(1000, 255, 255, 255);

        // Built-in bloom for celebration glow
        try {
            const fx = this.cameras.main.postFX;
            if (fx) {
                fx.addBloom(0xffffff, 1, 1, 1, 0.5);
                fx.addVignette(0.5, 0.5, 0.25);
            }
        } catch (_) { /* canvas */ }

        // Celebration stars — animated twinkle
        for (let i = 0; i < 120; i++) {
            const starColor = [COLORS.positive, COLORS.textHighlight, COLORS.warning, 0xffdd44][Math.floor(Math.random() * 4)];
            const star = this.add.circle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                1 + Math.random() * 2.5,
                starColor,
                0.3 + Math.random() * 0.5
            );
            this.tweens.add({
                targets: star,
                alpha: 0.05 + Math.random() * 0.15,
                duration: 800 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000,
            });
        }

        // Title — fade in with scale pop
        const title = this.add.text(GAME_WIDTH / 2, 80, 'TRADING EMPIRE', {
            fontSize: '40px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.8);

        this.tweens.add({
            targets: title,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            delay: 500,
            ease: 'Back.out',
        });

        this.add.text(GAME_WIDTH / 2, 130, 'You have built a legendary trading empire across the stars.', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Victory conditions met
        this.add.text(GAME_WIDTH / 2, 180, 'GOALS ACHIEVED', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.warning.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        const goals = [
            `Credits: ${VICTORY_CREDITS.toLocaleString()} reached`,
            `Systems visited: ${VICTORY_SYSTEMS}+`,
            `Trades completed: ${VICTORY_TRADES}+`,
        ];

        for (let i = 0; i < goals.length; i++) {
            this.add.text(GAME_WIDTH / 2, 210 + i * 24, `\u2605 ${goals[i]}`, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);
        }

        // Final stats
        if (this.gameState) {
            this.add.text(GAME_WIDTH / 2, 310, 'FINAL STATISTICS', {
                fontSize: '16px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);

            const stats = [
                `Captain: ${this.gameState.player.name}`,
                `Ship: ${this.gameState.player.ship.name}`,
                `Days Survived: ${this.gameState.player.daysSurvived}`,
                `Final Credits: ${this.gameState.player.credits.toLocaleString()}`,
                `Total Profit: ${this.gameState.player.totalProfit.toLocaleString()}`,
                `Trades Made: ${this.gameState.player.totalTrades}`,
                `Systems Visited: ${this.gameState.player.systemsVisited.length}`,
                `Pirates Defeated: ${this.gameState.player.piratesDefeated}`,
                `Crew Members Hired: ${this.gameState.player.crewHired}`,
                `Cargo Sold: ${this.gameState.player.cargoSold}`,
            ];

            for (let i = 0; i < stats.length; i++) {
                this.add.text(GAME_WIDTH / 2, 340 + i * 24, stats[i], {
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
                }).setOrigin(0.5, 0.5);
            }
        }

        // Play again button with fade-out transition
        const btnY = GAME_HEIGHT - 60;
        const bg = this.add.rectangle(GAME_WIDTH / 2, btnY, 200, 44, COLORS.positive, 0.2);
        bg.setStrokeStyle(2, COLORS.positive, 0.6);

        this.add.text(GAME_WIDTH / 2, btnY, 'PLAY AGAIN', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        bg.setInteractive();
        bg.on('pointerdown', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }
}
