// ============================================================
// Star Routes - Star System Entity
// Star system node rendering on galaxy map
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { StarSystemData } from '../types';
import { COLORS } from '../config/constants';
import { FACTION_MAP } from '../config/faction-data';

export class StarSystemEntity extends GameObjects.Container {
    private starGlow: GameObjects.Arc;
    private starCore: GameObjects.Arc;
    private nameText: GameObjects.Text;
    private selectionRing: GameObjects.Arc;
    private dangerIndicator: GameObjects.Arc;
    private systemData: StarSystemData;
    private isSelected: boolean = false;
    private pulseTimer: number = 0;

    constructor(scene: Scene, data: StarSystemData, scale: number = 1) {
        super(scene, data.x * scale, data.y * scale);
        this.systemData = data;

        const baseSize = 3 + data.size * 1.5;

        // Outer glow
        this.starGlow = scene.add.circle(0, 0, baseSize * 3, data.color, 0.08);
        this.add(this.starGlow);

        // Danger indicator (red ring for dangerous systems)
        this.dangerIndicator = scene.add.circle(0, 0, baseSize * 2.5, COLORS.negative, 0);
        this.dangerIndicator.setStrokeStyle(1, COLORS.negative, data.dangerLevel * 0.5);
        this.add(this.dangerIndicator);

        // Selection ring
        this.selectionRing = scene.add.circle(0, 0, baseSize * 2, COLORS.textHighlight, 0);
        this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
        this.add(this.selectionRing);

        // Core star
        this.starCore = scene.add.circle(0, 0, baseSize, data.color, 0.9);
        this.add(this.starCore);

        // Name text
        const factionColor = data.factionId
            ? '#' + (FACTION_MAP.get(data.factionId)?.color ?? COLORS.textPrimary).toString(16).padStart(6, '0')
            : '#' + COLORS.textSecondary.toString(16).padStart(6, '0');

        this.nameText = scene.add.text(0, baseSize + 8, data.name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: factionColor,
            align: 'center',
        }).setOrigin(0.5, 0);
        this.add(this.nameText);

        // Undiscovered systems are dim
        if (!data.discovered) {
            this.setAlpha(0.25);
            this.nameText.setText('???');
        }

        // Make interactive
        this.setSize(baseSize * 6, baseSize * 6);
        this.setInteractive();

    }

    get systemInfo(): StarSystemData {
        return this.systemData;
    }

    setSelected(selected: boolean): void {
        this.isSelected = selected;
        if (selected) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 1);
        } else {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
        }
    }

    setHovered(hovered: boolean): void {
        if (hovered && !this.isSelected) {
            this.selectionRing.setStrokeStyle(1, COLORS.textHighlight, 0.5);
        } else if (!this.isSelected) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
        }
    }

    setPlayerHere(isHere: boolean): void {
        if (isHere) {
            this.selectionRing.setStrokeStyle(2, COLORS.positive, 1);
        } else if (!this.isSelected) {
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, 0);
        }
    }

    discover(): void {
        this.systemData.discovered = true;
        this.setAlpha(1);
        this.nameText.setText(this.systemData.name);
    }

    update(_time: number, delta: number): void {
        this.pulseTimer += delta * 0.003;

        // Gentle pulse for the glow
        const pulse = 0.06 + Math.sin(this.pulseTimer) * 0.03;
        this.starGlow.setAlpha(pulse);

        if (this.isSelected) {
            const selectPulse = 0.7 + Math.sin(this.pulseTimer * 2) * 0.3;
            this.selectionRing.setStrokeStyle(2, COLORS.textHighlight, selectPulse);
        }
    }
}
