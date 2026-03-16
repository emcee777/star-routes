// ============================================================
// Star Routes - Main Menu Scene
// Title with glow, multi-layer starfield, nebula background,
// shooting stars, animated buttons, mouse parallax, built-in FX
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';

interface StarParticle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
    baseAlpha: number;
    speed: number;
    color: number;
    graphic: GameObjects.Arc;
    layer: number;
    parallaxFactor: number;
}

interface NebulaPatch {
    graphic: GameObjects.Arc;
    baseX: number;
    baseY: number;
    parallaxFactor: number;
}

export class MainMenu extends Scene {
    private stars: StarParticle[] = [];
    private nebulae: NebulaPatch[] = [];
    private saveSystem: SaveSystem;
    private titleGlow!: GameObjects.Text;
    private shootingStarTimer: number = 0;
    private shootingStars: Array<{
        graphic: GameObjects.Graphics;
        x: number; y: number;
        angle: number; speed: number;
        life: number; maxLife: number;
    }> = [];
    private mouseX: number = GAME_WIDTH / 2;
    private mouseY: number = GAME_HEIGHT / 2;

    constructor() {
        super('MainMenu');
        this.saveSystem = new SaveSystem();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Phaser built-in bloom + vignette (WebGL only)
        try {
            const fx = this.cameras.main.postFX;
            if (fx) {
                fx.addBloom(0xffffff, 1, 1, 1, 0.35);
                fx.addVignette(0.5, 0.5, 0.35);
            }
        } catch (_e) {
            // Canvas fallback — no post FX
        }

        // Fade in from black
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // Create ambient star background (3 layers) — behind nebulae
        this.createStarfield();

        // Richer nebula clouds
        this.createMenuNebulae();

        // Title glow (behind)
        this.titleGlow = this.add.text(GAME_WIDTH / 2, 160, 'STAR ROUTES', {
            fontSize: '50px',
            fontFamily: 'monospace',
            color: '#113355',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5).setAlpha(0.4);

        // Title
        this.add.text(GAME_WIDTH / 2, 160, 'STAR ROUTES', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Subtitle
        this.add.text(GAME_WIDTH / 2, 215, 'A Space Trading Simulation', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Decorative line
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, COLORS.textHighlight, 0.3);
        lineGfx.lineBetween(GAME_WIDTH / 2 - 150, 240, GAME_WIDTH / 2 + 150, 240);
        lineGfx.fillStyle(COLORS.textHighlight, 0.1);
        lineGfx.fillCircle(GAME_WIDTH / 2, 240, 3);

        // New Game button
        this.createMenuButton(GAME_WIDTH / 2, 320, 'NEW GAME', COLORS.positive, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('NewGame');
            });
        });

        // Continue button (if save exists)
        if (this.saveSystem.hasSave('auto')) {
            this.createMenuButton(GAME_WIDTH / 2, 385, 'CONTINUE', COLORS.textHighlight, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('StationScene', { loadSave: true });
                });
            });
        }

        // Flavor text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Buy low. Sell high. Survive the void.', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            fontStyle: 'italic',
        }).setOrigin(0.5, 0.5);

        // Version
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 15, 'v1.0', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0.5).setAlpha(0.5);

        // Track mouse for parallax
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.mouseX = pointer.x;
            this.mouseY = pointer.y;
        });
    }

    private createStarfield(): void {
        const layerConfigs = [
            { count: 80, minSize: 0.3, maxSize: 1.0, minAlpha: 0.1, maxAlpha: 0.3, parallax: 0.005 },
            { count: 50, minSize: 0.5, maxSize: 1.5, minAlpha: 0.2, maxAlpha: 0.5, parallax: 0.010 },
            { count: 25, minSize: 1.0, maxSize: 2.5, minAlpha: 0.3, maxAlpha: 0.8, parallax: 0.018 },
        ];

        const starColors = [0xffffff, 0xaabbff, 0xffddaa, 0xffaaaa, 0xccddff];

        for (let layer = 0; layer < layerConfigs.length; layer++) {
            const cfg = layerConfigs[layer];
            for (let i = 0; i < cfg.count; i++) {
                const x = Math.random() * GAME_WIDTH;
                const y = Math.random() * GAME_HEIGHT;
                const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
                const alpha = cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha);
                const speed = 0.3 + layer * 0.5 + Math.random() * 0.5;
                const color = starColors[Math.floor(Math.random() * starColors.length)];

                const graphic = this.add.circle(x, y, size, color, alpha);

                // Add preFX glow on the largest stars (layer 2)
                if (layer === 2 && size > 1.8) {
                    try {
                        graphic.preFX?.addGlow(color, 4, 0, false, 0.1, 8);
                    } catch (_) { /* canvas fallback */ }
                }

                this.stars.push({ x, y, baseX: x, baseY: y, size, baseAlpha: alpha, speed, color, graphic, layer, parallaxFactor: cfg.parallax });
            }
        }
    }

    private createMenuNebulae(): void {
        // Larger, richer nebulae with varied colors
        const nebulaDefs = [
            { color: 0x2233aa, x: 150,            y: 180,           r: 180, alpha: 0.03, parallax: 0.003 },
            { color: 0x442266, x: GAME_WIDTH-200,  y: GAME_HEIGHT/2, r: 200, alpha: 0.025,parallax: 0.004 },
            { color: 0x224466, x: GAME_WIDTH/2,    y: GAME_HEIGHT-120,r:160, alpha: 0.03, parallax: 0.002 },
            { color: 0x334422, x: GAME_WIDTH*0.7,  y: 100,           r: 140, alpha: 0.02, parallax: 0.005 },
            { color: 0x553311, x: 300,             y: GAME_HEIGHT-180,r:120, alpha: 0.025,parallax: 0.003 },
        ];

        for (const def of nebulaDefs) {
            const graphic = this.add.circle(def.x, def.y, def.r, def.color, def.alpha);
            this.nebulae.push({ graphic, baseX: def.x, baseY: def.y, parallaxFactor: def.parallax });
        }
    }

    private createMenuButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
        const width = 240;
        const height = 48;

        // Button glow (behind)
        const glow = this.add.rectangle(x, y, width + 8, height + 8, color, 0.04);

        const bg = this.add.rectangle(x, y, width, height, color, 0.12);
        bg.setStrokeStyle(2, color, 0.5);

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
            bg.setStrokeStyle(2, color, 0.8);
            glow.setAlpha(0.08);
            text.setColor('#ffffff');
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(color, 0.12);
            bg.setStrokeStyle(2, color, 0.5);
            glow.setAlpha(0.04);
            text.setColor('#' + color.toString(16).padStart(6, '0'));
        });
    }

    update(_time: number, delta: number): void {
        const t = _time * 0.001;

        // Compute mouse offset from center (clamped to ±2px shift per parallax unit)
        const dx = (this.mouseX - GAME_WIDTH / 2);
        const dy = (this.mouseY - GAME_HEIGHT / 2);

        // Twinkle + parallax for stars
        for (const star of this.stars) {
            const twinkle = star.baseAlpha +
                Math.sin(star.speed * t + star.x * 0.05) * star.baseAlpha * 0.25 +
                Math.sin(star.speed * t * 2.3 + star.y * 0.07) * star.baseAlpha * 0.1;
            star.graphic.setAlpha(Math.max(0.05, Math.min(0.95, twinkle)));

            // Subtle parallax: near layers shift more
            const px = star.baseX + dx * star.parallaxFactor;
            const py = star.baseY + dy * star.parallaxFactor;
            star.graphic.setPosition(px, py);
        }

        // Nebula parallax
        for (const neb of this.nebulae) {
            neb.graphic.setPosition(
                neb.baseX + dx * neb.parallaxFactor,
                neb.baseY + dy * neb.parallaxFactor
            );
        }

        // Title glow pulse
        if (this.titleGlow) {
            const glowAlpha = 0.3 + Math.sin(t * 1.5) * 0.1;
            this.titleGlow.setAlpha(glowAlpha);
        }

        // Shooting stars — spawn every 5-10 seconds
        this.shootingStarTimer += delta * 0.001;
        if (this.shootingStarTimer > 5 + Math.random() * 5) {
            this.shootingStarTimer = 0;
            this.spawnShootingStar();
        }

        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const star = this.shootingStars[i];
            star.life += delta * 0.001;

            if (star.life >= star.maxLife) {
                star.graphic.destroy();
                this.shootingStars.splice(i, 1);
                continue;
            }

            const progress = star.life / star.maxLife;
            const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
            const tailLength = 25 + progress * 35;

            star.x += Math.cos(star.angle) * star.speed * delta * 0.001;
            star.y += Math.sin(star.angle) * star.speed * delta * 0.001;

            star.graphic.clear();
            star.graphic.lineStyle(1.5, 0xffffff, alpha * 0.85);
            star.graphic.lineBetween(
                star.x, star.y,
                star.x - Math.cos(star.angle) * tailLength,
                star.y - Math.sin(star.angle) * tailLength
            );
            // Tip glow
            star.graphic.fillStyle(0xffffff, alpha * 0.5);
            star.graphic.fillCircle(star.x, star.y, 1.5);
        }
    }

    private spawnShootingStar(): void {
        const graphic = this.add.graphics();
        this.shootingStars.push({
            graphic,
            x: Math.random() * GAME_WIDTH * 0.7,
            y: 10 + Math.random() * GAME_HEIGHT * 0.45,
            angle: 0.2 + Math.random() * 0.6,
            speed: 250 + Math.random() * 200,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.5,
        });
    }
}
