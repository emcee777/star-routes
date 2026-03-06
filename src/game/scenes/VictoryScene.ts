// ============================================================
// Star Routes - Victory Scene
// Reached trading empire goal. Final stats and celebration.
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

        // Celebration stars
        for (let i = 0; i < 100; i++) {
            const star = this.add.circle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                1 + Math.random() * 2,
                [COLORS.positive, COLORS.textHighlight, COLORS.warning, 0xffdd44][Math.floor(Math.random() * 4)],
                0.3 + Math.random() * 0.5
            );
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
            });
        }

        // Title
        this.add.text(GAME_WIDTH / 2, 80, 'TRADING EMPIRE', {
            fontSize: '40px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

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
            this.add.text(GAME_WIDTH / 2, 210 + i * 24, `* ${goals[i]}`, {
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

        // Play again button
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
            this.scene.start('MainMenu');
        });
    }
}
