// ============================================================
// Star Routes - Main Menu Scene
// Title with glow, multi-layer starfield, nebula background,
// shooting stars, animated buttons
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';

interface StarParticle {
    x: number;
    y: number;
    size: number;
    baseAlpha: number;
    speed: number;
    color: number;
    graphic: GameObjects.Arc;
    layer: number;
}

export class MainMenu extends Scene {
    private stars: StarParticle[] = [];
    private saveSystem: SaveSystem;
    private titleGlow!: GameObjects.Text;
    private shootingStarTimer: number = 0;
    private shootingStars: Array<{
        graphic: GameObjects.Graphics;
        x: number; y: number;
        angle: number; speed: number;
        life: number; maxLife: number;
    }> = [];

    constructor() {
        super('MainMenu');
        this.saveSystem = new SaveSystem();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Apply bloom if available
        const renderer = this.renderer;
        if (renderer && 'pipelines' in renderer) {
            try {
                this.cameras.main.setPostPipeline('BloomPipeline');
            } catch (_e) {
                // WebGL pipeline not available (Canvas mode)
            }
        }

        // Create ambient star background (3 layers)
        this.createStarfield();

        // Nebula clouds behind title
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
            this.scene.start('NewGame');
        });

        // Continue button (if save exists)
        if (this.saveSystem.hasSave('auto')) {
            this.createMenuButton(GAME_WIDTH / 2, 385, 'CONTINUE', COLORS.textHighlight, () => {
                this.scene.start('StationScene', { loadSave: true });
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
    }

    private createStarfield(): void {
        const layerConfigs = [
            { count: 80, minSize: 0.3, maxSize: 1.0, minAlpha: 0.1, maxAlpha: 0.3 },
            { count: 50, minSize: 0.5, maxSize: 1.5, minAlpha: 0.2, maxAlpha: 0.5 },
            { count: 25, minSize: 1.0, maxSize: 2.5, minAlpha: 0.3, maxAlpha: 0.8 },
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

                this.stars.push({ x, y, size, baseAlpha: alpha, speed, color, graphic, layer });
            }
        }
    }

    private createMenuNebulae(): void {
        const colors = [0x2233aa, 0x442266, 0x224466];
        for (let i = 0; i < 3; i++) {
            this.add.circle(
                200 + Math.random() * (GAME_WIDTH - 400),
                100 + Math.random() * (GAME_HEIGHT - 200),
                100 + Math.random() * 80,
                colors[i],
                0.02 + Math.random() * 0.02
            );
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

        // Twinkle stars with multi-frequency noise
        for (const star of this.stars) {
            const twinkle = star.baseAlpha +
                Math.sin(star.speed * t + star.x * 0.05) * star.baseAlpha * 0.25 +
                Math.sin(star.speed * t * 2.3 + star.y * 0.07) * star.baseAlpha * 0.1;
            star.graphic.setAlpha(Math.max(0.05, Math.min(0.95, twinkle)));
        }

        // Title glow pulse
        if (this.titleGlow) {
            const glowAlpha = 0.3 + Math.sin(t * 1.5) * 0.1;
            this.titleGlow.setAlpha(glowAlpha);
        }

        // Shooting stars
        this.shootingStarTimer += delta * 0.001;
        if (this.shootingStarTimer > 8 + Math.random() * 7) {
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
            star.graphic.lineStyle(1, 0xffffff, alpha * 0.7);
            star.graphic.lineBetween(
                star.x, star.y,
                star.x - Math.cos(star.angle) * tailLength,
                star.y - Math.sin(star.angle) * tailLength
            );
        }
    }

    private spawnShootingStar(): void {
        const graphic = this.add.graphics();
        this.shootingStars.push({
            graphic,
            x: Math.random() * GAME_WIDTH * 0.6,
            y: 20 + Math.random() * GAME_HEIGHT * 0.4,
            angle: 0.2 + Math.random() * 0.6,
            speed: 250 + Math.random() * 200,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.5,
        });
    }
}
