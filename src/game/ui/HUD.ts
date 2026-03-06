// ============================================================
// Star Routes - HUD
// Always visible: credits, cargo space, location, in-game date
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState } from '../types';
import { COLORS, GAME_WIDTH } from '../config/constants';
import { TimeSystem } from '../systems/TimeSystem';

export class HUD extends GameObjects.Container {
    private creditsText: GameObjects.Text;
    private cargoText: GameObjects.Text;
    private locationText: GameObjects.Text;
    private timeText: GameObjects.Text;
    private hullBar: GameObjects.Rectangle;
    private hullBg: GameObjects.Rectangle;
    private shieldBar: GameObjects.Rectangle;
    private shieldBg: GameObjects.Rectangle;
    private fuelBar: GameObjects.Rectangle;
    private fuelBg: GameObjects.Rectangle;
    private hullLabel: GameObjects.Text;
    private shieldLabel: GameObjects.Text;
    private fuelLabel: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(1000);

        const panelHeight = 40;
        const bg = scene.add.rectangle(GAME_WIDTH / 2, panelHeight / 2, GAME_WIDTH, panelHeight, COLORS.panelBg, 0.9);
        bg.setStrokeStyle(1, COLORS.panelBorder, 0.5);
        this.add(bg);

        // Credits
        this.creditsText = scene.add.text(10, panelHeight / 2, 'Credits: 5000', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.creditsText);

        // Cargo
        this.cargoText = scene.add.text(160, panelHeight / 2, 'Cargo: 0/20', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.cargoBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.cargoText);

        // Location
        this.locationText = scene.add.text(320, panelHeight / 2, 'Location: ---', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.locationText);

        // Time
        this.timeText = scene.add.text(GAME_WIDTH - 10, panelHeight / 2, 'Day 1', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0.5);
        this.add(this.timeText);

        // Status bars
        const barY = panelHeight + 6;
        const barHeight = 4;
        const barWidth = 100;

        // Hull bar
        this.hullLabel = scene.add.text(10, barY, 'H', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.hullBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.hullLabel);

        this.hullBg = scene.add.rectangle(22 + barWidth / 2, barY, barWidth, barHeight, 0x222233);
        this.add(this.hullBg);
        this.hullBar = scene.add.rectangle(22, barY, barWidth, barHeight, COLORS.hullBar);
        this.hullBar.setOrigin(0, 0.5);
        this.add(this.hullBar);

        // Shield bar
        this.shieldLabel = scene.add.text(130, barY, 'S', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.shieldBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.shieldLabel);

        this.shieldBg = scene.add.rectangle(142 + barWidth / 2, barY, barWidth, barHeight, 0x222233);
        this.add(this.shieldBg);
        this.shieldBar = scene.add.rectangle(142, barY, barWidth, barHeight, COLORS.shieldBar);
        this.shieldBar.setOrigin(0, 0.5);
        this.add(this.shieldBar);

        // Fuel bar
        this.fuelLabel = scene.add.text(250, barY, 'F', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.fuelBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.fuelLabel);

        this.fuelBg = scene.add.rectangle(262 + barWidth / 2, barY, barWidth, barHeight, 0x222233);
        this.add(this.fuelBg);
        this.fuelBar = scene.add.rectangle(262, barY, barWidth, barHeight, COLORS.fuelBar);
        this.fuelBar.setOrigin(0, 0.5);
        this.add(this.fuelBar);

        scene.add.existing(this);
    }

    updateDisplay(player: PlayerState, systemName: string, timeSystem: TimeSystem): void {
        this.creditsText.setText(`Credits: ${player.credits.toLocaleString()}`);

        const cargoUsed = player.ship.cargo.reduce((sum, c) => sum + c.quantity, 0);
        this.cargoText.setText(`Cargo: ${cargoUsed}/${player.ship.cargoCapacity}`);
        this.locationText.setText(`Location: ${systemName}`);
        this.timeText.setText(timeSystem.formatTime());

        // Update bars
        const barWidth = 100;
        this.hullBar.setSize(Math.max(1, (player.ship.hull / player.ship.maxHull) * barWidth), 4);
        this.shieldBar.setSize(Math.max(1, (player.ship.shield / player.ship.maxShield) * barWidth), 4);
        this.fuelBar.setSize(Math.max(1, (player.ship.fuel / player.ship.maxFuel) * barWidth), 4);

        // Color hull bar red when low
        if (player.ship.hull / player.ship.maxHull < 0.3) {
            this.hullBar.setFillStyle(COLORS.negative);
        } else {
            this.hullBar.setFillStyle(COLORS.hullBar);
        }

        // Color fuel bar red when low
        if (player.ship.fuel / player.ship.maxFuel < 0.2) {
            this.fuelBar.setFillStyle(COLORS.negative);
        } else {
            this.fuelBar.setFillStyle(COLORS.fuelBar);
        }
    }
}
