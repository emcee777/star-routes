// ============================================================
// Star Routes - Ship Entity
// Ship rendering and stat display
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerShip } from '../types';
import { COLORS } from '../config/constants';
import { SHIP_MAP } from '../config/ship-data';

export class ShipEntity extends GameObjects.Container {
    private shipBody: GameObjects.Polygon;
    private engineGlow: GameObjects.Arc;
    private shieldArc: GameObjects.Arc;
    private isMoving: boolean = false;
    private enginePulse: number = 0;

    constructor(scene: Scene, x: number, y: number, ship: PlayerShip) {
        super(scene, x, y);

        const def = SHIP_MAP.get(ship.defId);
        const scale = def ? 0.8 + (def.moduleSlots / 6) * 0.4 : 1;

        // Ship body as a triangle/arrow shape
        const points = [
            { x: 0, y: -12 * scale },
            { x: -8 * scale, y: 8 * scale },
            { x: 0, y: 4 * scale },
            { x: 8 * scale, y: 8 * scale },
        ];
        this.shipBody = scene.add.polygon(0, 0, points, COLORS.textPrimary, 0.9);
        this.shipBody.setStrokeStyle(1, COLORS.textHighlight, 0.6);
        this.add(this.shipBody);

        // Engine glow
        this.engineGlow = scene.add.circle(0, 6 * scale, 3 * scale, COLORS.fuelBar, 0.5);
        this.add(this.engineGlow);

        // Shield arc (visible when shield > 0)
        this.shieldArc = scene.add.circle(0, 0, 16 * scale, COLORS.shieldBar, 0);
        this.shieldArc.setStrokeStyle(1, COLORS.shieldBar, ship.shield > 0 ? 0.3 : 0);
        this.add(this.shieldArc);

        scene.add.existing(this);
    }

    setMoving(moving: boolean, angle?: number): void {
        this.isMoving = moving;
        if (angle !== undefined) {
            this.setRotation(angle + Math.PI / 2);
        }
    }

    update(_time: number, delta: number): void {
        if (this.isMoving) {
            this.enginePulse += delta * 0.01;
            const glow = 0.4 + Math.sin(this.enginePulse * 3) * 0.3;
            this.engineGlow.setAlpha(glow);
            this.engineGlow.setScale(1 + Math.sin(this.enginePulse * 5) * 0.2);
        } else {
            this.engineGlow.setAlpha(0.2);
        }
    }

    updateShield(shieldPercent: number): void {
        this.shieldArc.setStrokeStyle(1, COLORS.shieldBar, shieldPercent > 0 ? 0.3 * shieldPercent : 0);
    }
}
