// ============================================================
// Star Routes - Ship Entity
// Ship rendering with engine glow trail, shield shimmer,
// thrust flare animation
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerShip } from '../types';
import { COLORS } from '../config/constants';
import { SHIP_MAP } from '../config/ship-data';

export class ShipEntity extends GameObjects.Container {
    private shipBody: GameObjects.Polygon;
    private engineGlow: GameObjects.Arc;
    private engineFlare: GameObjects.Arc;
    private thrustTrail: GameObjects.Arc;
    private shieldArc: GameObjects.Arc;
    private shieldShimmer: GameObjects.Arc;
    private isMoving: boolean = false;
    private enginePulse: number = 0;
    private shipScale: number;

    constructor(scene: Scene, x: number, y: number, ship: PlayerShip) {
        super(scene, x, y);

        const def = SHIP_MAP.get(ship.defId);
        this.shipScale = def ? 0.8 + (def.moduleSlots / 6) * 0.4 : 1;
        const scale = this.shipScale;

        // Shield shimmer (outermost)
        this.shieldShimmer = scene.add.circle(0, 0, 20 * scale, COLORS.shieldBar, 0);
        this.add(this.shieldShimmer);

        // Shield arc (visible when shield > 0)
        this.shieldArc = scene.add.circle(0, 0, 16 * scale, COLORS.shieldBar, 0);
        this.shieldArc.setStrokeStyle(1, COLORS.shieldBar, ship.shield > 0 ? 0.3 : 0);
        this.add(this.shieldArc);

        // Thrust trail (furthest back)
        this.thrustTrail = scene.add.circle(0, 10 * scale, 5 * scale, COLORS.fuelBar, 0);
        this.add(this.thrustTrail);

        // Engine flare (medium glow behind engine)
        this.engineFlare = scene.add.circle(0, 8 * scale, 6 * scale, COLORS.fuelBar, 0);
        this.add(this.engineFlare);

        // Ship body as a triangle/arrow shape
        const points = [
            { x: 0, y: -12 * scale },
            { x: -8 * scale, y: 8 * scale },
            { x: 0, y: 4 * scale },
            { x: 8 * scale, y: 8 * scale },
        ];
        this.shipBody = scene.add.polygon(0, 0, points, COLORS.textPrimary, 0.9);
        this.shipBody.setStrokeStyle(1, COLORS.textHighlight, 0.4);
        this.add(this.shipBody);

        // Engine glow (core)
        this.engineGlow = scene.add.circle(0, 6 * scale, 3 * scale, COLORS.fuelBar, 0.6);
        this.add(this.engineGlow);

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

            // Engine core glow
            const glow = 0.5 + Math.sin(this.enginePulse * 3) * 0.3;
            this.engineGlow.setAlpha(glow);
            this.engineGlow.setScale(1 + Math.sin(this.enginePulse * 5) * 0.15);

            // Engine flare (wider, softer)
            const flare = 0.15 + Math.sin(this.enginePulse * 4) * 0.1;
            this.engineFlare.setAlpha(flare);
            this.engineFlare.setScale(1 + Math.sin(this.enginePulse * 3) * 0.3);

            // Thrust trail (trailing glow)
            const trail = 0.06 + Math.sin(this.enginePulse * 2) * 0.04;
            this.thrustTrail.setAlpha(trail);
            this.thrustTrail.setScale(1.5 + Math.sin(this.enginePulse * 1.5) * 0.5);

            // Shield shimmer when moving
            const shimmer = Math.sin(this.enginePulse * 7) * 0.03;
            this.shieldShimmer.setAlpha(Math.max(0, shimmer));
        } else {
            this.engineGlow.setAlpha(0.15);
            this.engineFlare.setAlpha(0.03);
            this.thrustTrail.setAlpha(0);
        }
    }

    updateShield(shieldPercent: number): void {
        this.shieldArc.setStrokeStyle(1, COLORS.shieldBar, shieldPercent > 0 ? 0.3 * shieldPercent : 0);
        this.shieldShimmer.setAlpha(shieldPercent > 0 ? 0.02 : 0);
    }
}
