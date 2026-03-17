// ============================================================
// Star Routes - HUD
// Always visible: credits with count animation, glowing
// status bars, cargo warning glow, location, date
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState } from '../types';
import { COLORS, GAME_WIDTH } from '../config/constants';
import { TimeSystem } from '../systems/TimeSystem';
import { AudioManager } from '../audio/AudioManager';
import { COMMODITY_MAP } from '../config/commodity-data';

export class HUD extends GameObjects.Container {
    private creditsText: GameObjects.Text;
    private cargoText: GameObjects.Text;
    private locationText: GameObjects.Text;
    private timeText: GameObjects.Text;
    private hullBar: GameObjects.Rectangle;
    private hullBg: GameObjects.Rectangle;
    private hullGlow: GameObjects.Rectangle;
    private shieldBar: GameObjects.Rectangle;
    private shieldBg: GameObjects.Rectangle;
    private shieldGlow: GameObjects.Rectangle;
    private fuelBar: GameObjects.Rectangle;
    private fuelBg: GameObjects.Rectangle;
    private fuelGlow: GameObjects.Rectangle;
    private hullLabel: GameObjects.Text;
    private shieldLabel: GameObjects.Text;
    private fuelLabel: GameObjects.Text;

    // Credit animation state
    private displayedCredits: number = 0;
    private targetCredits: number = 0;
    private creditFlashTimer: number = 0;
    private creditFlashColor: number = COLORS.positive;

    // Bar glow timers
    private glowTimer: number = 0;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        this.setDepth(1000);

        const panelHeight = 40;

        // Panel background with border glow
        const bgGlow = scene.add.rectangle(GAME_WIDTH / 2, panelHeight / 2, GAME_WIDTH, panelHeight + 2, COLORS.panelBorder, 0.15);
        this.add(bgGlow);
        const bg = scene.add.rectangle(GAME_WIDTH / 2, panelHeight / 2, GAME_WIDTH, panelHeight, COLORS.panelBg, 0.92);
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
        this.cargoText = scene.add.text(170, panelHeight / 2, 'Cargo: 0/20', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.cargoBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.cargoText);

        // Location
        this.locationText = scene.add.text(330, panelHeight / 2, 'Location: ---', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.locationText);

        // Mute toggle button
        const muteBtn = scene.add.text(GAME_WIDTH - 110, panelHeight / 2, AudioManager.isMuted ? '[MUTE]' : '[SND]', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5).setInteractive();
        muteBtn.on('pointerdown', () => {
            const muted = AudioManager.toggleMute();
            muteBtn.setText(muted ? '[MUTE]' : '[SND]');
            muteBtn.setColor(muted
                ? '#' + COLORS.negative.toString(16).padStart(6, '0')
                : '#' + COLORS.textSecondary.toString(16).padStart(6, '0'));
        });
        muteBtn.on('pointerover', () => muteBtn.setColor('#' + COLORS.textHighlight.toString(16).padStart(6, '0')));
        muteBtn.on('pointerout', () => muteBtn.setColor(AudioManager.isMuted
            ? '#' + COLORS.negative.toString(16).padStart(6, '0')
            : '#' + COLORS.textSecondary.toString(16).padStart(6, '0')));
        this.add(muteBtn);

        // Time
        this.timeText = scene.add.text(GAME_WIDTH - 10, panelHeight / 2, 'Day 1', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0.5);
        this.add(this.timeText);

        // Status bars with glow layer
        const barY = panelHeight + 8;
        const barHeight = 5;
        const barWidth = 100;

        // Hull bar
        this.hullLabel = scene.add.text(10, barY, 'H', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.hullBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.hullLabel);

        this.hullBg = scene.add.rectangle(22 + barWidth / 2, barY, barWidth, barHeight, 0x111122);
        this.add(this.hullBg);
        this.hullGlow = scene.add.rectangle(22, barY, barWidth, barHeight + 4, COLORS.hullBar, 0.1);
        this.hullGlow.setOrigin(0, 0.5);
        this.add(this.hullGlow);
        this.hullBar = scene.add.rectangle(22, barY, barWidth, barHeight, COLORS.hullBar);
        this.hullBar.setOrigin(0, 0.5);
        this.add(this.hullBar);

        // Shield bar
        this.shieldLabel = scene.add.text(132, barY, 'S', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.shieldBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.shieldLabel);

        this.shieldBg = scene.add.rectangle(144 + barWidth / 2, barY, barWidth, barHeight, 0x111122);
        this.add(this.shieldBg);
        this.shieldGlow = scene.add.rectangle(144, barY, barWidth, barHeight + 4, COLORS.shieldBar, 0.1);
        this.shieldGlow.setOrigin(0, 0.5);
        this.add(this.shieldGlow);
        this.shieldBar = scene.add.rectangle(144, barY, barWidth, barHeight, COLORS.shieldBar);
        this.shieldBar.setOrigin(0, 0.5);
        this.add(this.shieldBar);

        // Fuel bar
        this.fuelLabel = scene.add.text(254, barY, 'F', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#' + COLORS.fuelBar.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);
        this.add(this.fuelLabel);

        this.fuelBg = scene.add.rectangle(266 + barWidth / 2, barY, barWidth, barHeight, 0x111122);
        this.add(this.fuelBg);
        this.fuelGlow = scene.add.rectangle(266, barY, barWidth, barHeight + 4, COLORS.fuelBar, 0.1);
        this.fuelGlow.setOrigin(0, 0.5);
        this.add(this.fuelGlow);
        this.fuelBar = scene.add.rectangle(266, barY, barWidth, barHeight, COLORS.fuelBar);
        this.fuelBar.setOrigin(0, 0.5);
        this.add(this.fuelBar);

        scene.add.existing(this);
    }

    updateDisplay(player: PlayerState, systemName: string, timeSystem: TimeSystem): void {
        // Credits with count-up/down animation
        const prevTarget = this.targetCredits;
        this.targetCredits = player.credits;
        if (this.displayedCredits === 0) {
            this.displayedCredits = player.credits; // Initial set
        }

        // Flash color on credit change
        if (prevTarget !== this.targetCredits && prevTarget !== 0) {
            this.creditFlashTimer = 0.5; // seconds
            this.creditFlashColor = this.targetCredits > prevTarget ? COLORS.positive : COLORS.negative;
        }

        this.creditsText.setText(`Credits: ${Math.round(this.displayedCredits).toLocaleString()}`);

        const cargoUsed = player.ship.cargo.reduce((sum, c) => {
            const commodity = COMMODITY_MAP.get(c.commodityId);
            return sum + (commodity?.weight ?? 1) * c.quantity;
        }, 0);
        const cargoRatio = cargoUsed / player.ship.cargoCapacity;
        this.cargoText.setText(`Cargo: ${cargoUsed}/${player.ship.cargoCapacity}`);

        // Cargo text glows when nearly full
        if (cargoRatio > 0.85) {
            this.cargoText.setColor('#' + COLORS.warning.toString(16).padStart(6, '0'));
        } else {
            this.cargoText.setColor('#' + COLORS.cargoBar.toString(16).padStart(6, '0'));
        }

        this.locationText.setText(`Location: ${systemName}`);
        this.timeText.setText(timeSystem.formatTime());

        // Update bars
        const barWidth = 100;
        const hullPct = player.ship.hull / player.ship.maxHull;
        const shieldPct = player.ship.shield / player.ship.maxShield;
        const fuelPct = player.ship.fuel / player.ship.maxFuel;

        this.hullBar.setSize(Math.max(1, hullPct * barWidth), 5);
        this.hullGlow.setSize(Math.max(1, hullPct * barWidth), 9);
        this.shieldBar.setSize(Math.max(1, shieldPct * barWidth), 5);
        this.shieldGlow.setSize(Math.max(1, shieldPct * barWidth), 9);
        this.fuelBar.setSize(Math.max(1, fuelPct * barWidth), 5);
        this.fuelGlow.setSize(Math.max(1, fuelPct * barWidth), 9);

        // Color hull bar red when low
        if (hullPct < 0.3) {
            this.hullBar.setFillStyle(COLORS.negative);
            this.hullGlow.setFillStyle(COLORS.negative, 0.15);
        } else {
            this.hullBar.setFillStyle(COLORS.hullBar);
            this.hullGlow.setFillStyle(COLORS.hullBar, 0.1);
        }

        // Color fuel bar red when low
        if (fuelPct < 0.2) {
            this.fuelBar.setFillStyle(COLORS.negative);
            this.fuelGlow.setFillStyle(COLORS.negative, 0.15);
        } else {
            this.fuelBar.setFillStyle(COLORS.fuelBar);
            this.fuelGlow.setFillStyle(COLORS.fuelBar, 0.1);
        }

        // Animate credit count
        this.glowTimer += 0.016; // approx 60fps

        if (this.displayedCredits !== this.targetCredits) {
            const diff = this.targetCredits - this.displayedCredits;
            const step = diff * 0.15;
            if (Math.abs(diff) < 1) {
                this.displayedCredits = this.targetCredits;
            } else {
                this.displayedCredits += step;
            }
            this.creditsText.setText(`Credits: ${Math.round(this.displayedCredits).toLocaleString()}`);
        }

        // Credit flash effect
        if (this.creditFlashTimer > 0) {
            this.creditFlashTimer -= 0.016;
            this.creditsText.setColor('#' + this.creditFlashColor.toString(16).padStart(6, '0'));
        } else {
            this.creditsText.setColor('#' + COLORS.positive.toString(16).padStart(6, '0'));
        }

        // Subtle glow pulse on bars
        const glowPulse = 0.08 + Math.sin(this.glowTimer * 2) * 0.04;
        this.hullGlow.setAlpha(glowPulse);
        this.shieldGlow.setAlpha(glowPulse);
        this.fuelGlow.setAlpha(glowPulse);
    }
}
