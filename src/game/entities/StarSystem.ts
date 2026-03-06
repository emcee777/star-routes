// ============================================================
// Star Routes - Star System Entity
// Multi-layered star rendering: core, inner glow, outer haze,
// twinkling animation, danger indicators
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { StarSystemData } from '../types';
import { COLORS } from '../config/constants';
import { FACTION_MAP } from '../config/faction-data';

export class StarSystemEntity extends GameObjects.Container {
    private outerHaze: GameObjects.Arc;
    private innerGlow: GameObjects.Arc;
    private starCore: GameObjects.Arc;
    private starHighlight: GameObjects.Arc;
    private nameText: GameObjects.Text;
    private selectionRing: GameObjects.Arc;
    private selectionGlow: GameObjects.Arc;
    private dangerIndicator: GameObjects.Arc;
    private playerMarker: GameObjects.Arc | null = null;
    private playerMarkerGlow: GameObjects.Arc | null = null;
    private systemData: StarSystemData;
    private isSelected: boolean = false;
    private isPlayerHere: boolean = false;
    private pulseTimer: number = 0;
    private twinkleOffset: number;
    private twinkleSpeed: number;
    private baseSize: number;

    constructor(scene: Scene, data: StarSystemData, scale: number = 1) {
        super(scene, data.x * scale, data.y * scale);
        this.systemData = data;

        // Unique twinkle per star (seeded from position)
        this.twinkleOffset = (data.x * 7.3 + data.y * 13.7) % 100;
        this.twinkleSpeed = 0.8 + ((data.x * 3.1 + data.y * 5.9) % 10) / 10;

        this.baseSize = 3 + data.size * 1.5;

        const factionColor = data.factionId
            ? (FACTION_MAP.get(data.factionId)?.color ?? data.color)
            : data.color;

        // Layer 1: Outer haze (very large, very faint)
        this.outerHaze = scene.add.circle(0, 0, this.baseSize * 5, factionColor, 0.04);
        this.add(this.outerHaze);

        // Layer 2: Inner glow (medium size, soft)
        this.innerGlow = scene.add.circle(0, 0, this.baseSize * 2.5, factionColor, 0.12);
        this.add(this.innerGlow);

        // Danger indicator (red ring for dangerous systems)
        this.dangerIndicator = scene.add.circle(0, 0, this.baseSize * 2.2, COLORS.negative, 0);
        if (data.dangerLevel > 0.3) {
            this.dangerIndicator.setStrokeStyle(
                1,
                COLORS.negative,
                Math.min(data.dangerLevel * 0.6, 0.5)
            );
        }
        this.add(this.dangerIndicator);

        // Selection glow (hidden until selected)
        this.selectionGlow = scene.add.circle(0, 0, this.baseSize * 3, COLORS.textHighlight, 0);
        this.add(this.selectionGlow);

        // Selection ring
        this.selectionRing = scene.add.circle(0, 0, this.baseSize * 2, COLORS.textHighlight, 0);
        this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
        this.add(this.selectionRing);

        // Layer 3: Star core — bright center
        const coreColor = this.getStarCoreColor(data.type);
        this.starCore = scene.add.circle(0, 0, this.baseSize, coreColor, 0.95);
        this.add(this.starCore);

        // Layer 4: Bright white highlight at center
        this.starHighlight = scene.add.circle(0, 0, this.baseSize * 0.4, 0xffffff, 0.9);
        this.add(this.starHighlight);

        // Name text
        const textColor = data.factionId
            ? '#' + (FACTION_MAP.get(data.factionId)?.color ?? COLORS.textPrimary).toString(16).padStart(6, '0')
            : '#' + COLORS.textSecondary.toString(16).padStart(6, '0');

        this.nameText = scene.add.text(0, this.baseSize + 10, data.name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: textColor,
            align: 'center',
        }).setOrigin(0.5, 0);
        this.add(this.nameText);

        // Undiscovered systems are dim
        if (!data.discovered) {
            this.setAlpha(0.2);
            this.nameText.setText('???');
        }

        // Make interactive
        this.setSize(this.baseSize * 8, this.baseSize * 8);
        this.setInteractive();
    }

    private getStarCoreColor(type: string): number {
        switch (type) {
            case 'yellow': return 0xffee88;
            case 'red': return 0xff6644;
            case 'blue': return 0x6688ff;
            case 'white': return 0xeeeeff;
            case 'orange': return 0xffaa44;
            case 'binary': return 0xaaddff;
            case 'neutron': return 0xccccff;
            case 'nebula': return 0xcc66ff;
            default: return 0xffffff;
        }
    }

    get systemInfo(): StarSystemData {
        return this.systemData;
    }

    setSelected(selected: boolean): void {
        this.isSelected = selected;
        if (selected) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 1);
            this.selectionGlow.setAlpha(0.08);
        } else if (!this.isPlayerHere) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
            this.selectionGlow.setAlpha(0);
        }
    }

    setHovered(hovered: boolean): void {
        if (hovered && !this.isSelected) {
            this.selectionRing.setStrokeStyle(1.5, COLORS.textHighlight, 0.6);
            this.selectionGlow.setAlpha(0.05);
            // Brighten the star slightly
            this.innerGlow.setAlpha(0.2);
        } else if (!this.isSelected && !this.isPlayerHere) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
            this.selectionGlow.setAlpha(0);
            this.innerGlow.setAlpha(0.12);
        }
    }

    setPlayerHere(isHere: boolean): void {
        this.isPlayerHere = isHere;
        if (isHere) {
            // Create player markers if not yet created
            if (!this.playerMarkerGlow) {
                this.playerMarkerGlow = this.scene.add.circle(0, 0, this.baseSize * 3.5, COLORS.positive, 0.06);
                this.addAt(this.playerMarkerGlow, 0);
            }
            if (!this.playerMarker) {
                this.playerMarker = this.scene.add.circle(0, 0, this.baseSize * 1.8, COLORS.positive, 0);
                this.playerMarker.setStrokeStyle(2, COLORS.positive, 0.9);
                // Insert after selectionRing
                const ringIndex = this.getIndex(this.selectionRing);
                this.addAt(this.playerMarker, ringIndex + 1);
            }
            this.playerMarkerGlow!.setAlpha(0.06);
            this.playerMarker!.setStrokeStyle(2, COLORS.positive, 0.9);
        } else {
            if (this.playerMarkerGlow) this.playerMarkerGlow.setAlpha(0);
            if (this.playerMarker) this.playerMarker.setStrokeStyle(2, COLORS.positive, 0);
            if (!this.isSelected) {
                this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
            }
        }
    }

    discover(): void {
        this.systemData.discovered = true;
        this.setAlpha(1);
        this.nameText.setText(this.systemData.name);
    }

    update(_time: number, delta: number): void {
        this.pulseTimer += delta * 0.001;

        // Twinkling: smooth noise-like alpha modulation, unique per star
        const t = this.pulseTimer * this.twinkleSpeed + this.twinkleOffset;
        const twinkle = 0.85 + Math.sin(t * 2.3) * 0.08 + Math.sin(t * 5.7) * 0.05 + Math.sin(t * 11.1) * 0.02;
        this.starCore.setAlpha(twinkle);
        this.starHighlight.setAlpha(twinkle * 0.9);

        // Outer haze slow pulse
        const hazePulse = 0.03 + Math.sin(t * 0.7) * 0.015;
        this.outerHaze.setAlpha(hazePulse);

        // Inner glow gentle modulation
        if (!this.isSelected) {
            const glowPulse = 0.10 + Math.sin(t * 1.3) * 0.03;
            this.innerGlow.setAlpha(glowPulse);
        }

        // Selected star: pulsing ring
        if (this.isSelected) {
            const selectPulse = 0.7 + Math.sin(this.pulseTimer * 3) * 0.3;
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, selectPulse);
            const selectGlowPulse = 0.06 + Math.sin(this.pulseTimer * 3) * 0.03;
            this.selectionGlow.setAlpha(selectGlowPulse);
        }

        // Player marker pulse
        if (this.isPlayerHere && this.playerMarker && this.playerMarkerGlow) {
            const playerPulse = 0.7 + Math.sin(this.pulseTimer * 2.5) * 0.3;
            this.playerMarker.setStrokeStyle(2, COLORS.positive, playerPulse);
            const playerGlowPulse = 0.04 + Math.sin(this.pulseTimer * 2.5) * 0.03;
            this.playerMarkerGlow.setAlpha(playerGlowPulse);
        }

        // Danger indicator pulse for high-danger systems
        if (this.systemData.dangerLevel > 0.5) {
            const dangerPulse = Math.sin(this.pulseTimer * 1.5) * 0.15 + 0.35;
            this.dangerIndicator.setStrokeStyle(
                1,
                COLORS.negative,
                this.systemData.dangerLevel * dangerPulse
            );
        }
    }
}
