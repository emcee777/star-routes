// ============================================================
// Star Routes - Game Over Scene
// Ship destroyed. Show final stats.
// ============================================================

import { Scene } from 'phaser';
import { GameState } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class GameOver extends Scene {
    private gameState: GameState | null = null;

    constructor() {
        super('GameOver');
    }

    init(data: { gameState?: GameState }): void {
        this.gameState = data.gameState ?? null;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(0x0a0008);

        // Title
        this.add.text(GAME_WIDTH / 2, 120, 'SHIP DESTROYED', {
            fontSize: '36px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.negative.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        this.add.text(GAME_WIDTH / 2, 170, 'Your journey among the stars has ended.', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Stats
        if (this.gameState) {
            const stats = [
                `Captain: ${this.gameState.player.name}`,
                `Days Survived: ${this.gameState.player.daysSurvived}`,
                `Credits: ${this.gameState.player.credits.toLocaleString()}`,
                `Total Profit: ${this.gameState.player.totalProfit.toLocaleString()}`,
                `Trades Made: ${this.gameState.player.totalTrades}`,
                `Systems Visited: ${this.gameState.player.systemsVisited.length}`,
                `Pirates Defeated: ${this.gameState.player.piratesDefeated}`,
                `Crew Hired: ${this.gameState.player.crewHired}`,
            ];

            for (let i = 0; i < stats.length; i++) {
                this.add.text(GAME_WIDTH / 2, 240 + i * 28, stats[i], {
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
                }).setOrigin(0.5, 0.5);
            }
        }

        // Try again button
        const btnY = GAME_HEIGHT - 100;
        const bg = this.add.rectangle(GAME_WIDTH / 2, btnY, 200, 44, COLORS.textHighlight, 0.2);
        bg.setStrokeStyle(2, COLORS.textHighlight, 0.6);

        this.add.text(GAME_WIDTH / 2, btnY, 'MAIN MENU', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        bg.setInteractive();
        bg.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
