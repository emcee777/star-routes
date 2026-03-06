// ============================================================
// Star Routes - Galaxy Map UI
// Parallax starfield, nebula clouds, animated routes, faction
// territories, system hover tooltips, shooting stars
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { StarSystemData } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GALAXY_MAP_PADDING } from '../config/constants';
import { FACTION_MAP } from '../config/faction-data';
import { StarSystemEntity } from '../entities/StarSystem';
import { PlannedRoute } from '../systems/NavigationSystem';

interface BgStar {
    graphic: GameObjects.Arc;
    layer: number;       // 0=far, 1=mid, 2=near
    baseAlpha: number;
    twinkleSpeed: number;
}

interface Nebula {
    graphic: GameObjects.Arc;
    driftX: number;
    driftY: number;
    baseX: number;
    baseY: number;
}

interface ShootingStar {
    graphic: GameObjects.Graphics;
    x: number;
    y: number;
    angle: number;
    speed: number;
    life: number;
    maxLife: number;
}

export class GalaxyMapUI extends GameObjects.Container {
    private systemEntities: Map<string, StarSystemEntity> = new Map();
    private routeGraphics: GameObjects.Graphics;
    private factionGraphics: GameObjects.Graphics;
    private routeAnimGraphics: GameObjects.Graphics;
    private routeInfoText: GameObjects.Text;
    private onSystemSelect: ((systemId: string) => void) | null = null;
    private mapScaleX: number;
    private mapScaleY: number;

    // Background layers
    private bgStars: BgStar[] = [];
    private nebulae: Nebula[] = [];
    private shootingStars: ShootingStar[] = [];
    private shootingStarTimer: number = 0;

    // Hover tooltip
    private tooltip: GameObjects.Container | null = null;
    private tooltipBg: GameObjects.Rectangle | null = null;
    private tooltipName: GameObjects.Text | null = null;
    private tooltipInfo: GameObjects.Text | null = null;
    // Route animation
    private routeAnimTimer: number = 0;
    private currentRoute: PlannedRoute | null = null;
    private cachedSystems: StarSystemData[] = [];

    constructor(
        scene: Scene,
        systems: StarSystemData[]
    ) {
        super(scene, 0, 0);
        this.cachedSystems = systems;

        // Calculate scale to fit galaxy in the view
        const viewWidth = GAME_WIDTH - GALAXY_MAP_PADDING * 2;
        const viewHeight = GAME_HEIGHT - GALAXY_MAP_PADDING * 2 - 60;
        this.mapScaleX = viewWidth / 1000;
        this.mapScaleY = viewHeight / 700;

        // --- Layer 0: Background starfield (3 parallax layers) ---
        this.createParallaxStarfield(scene);

        // --- Layer 1: Nebula clouds ---
        this.createNebulae(scene);

        // Faction territory background
        this.factionGraphics = scene.add.graphics();
        this.add(this.factionGraphics);
        this.drawFactionTerritories(systems);

        // Route lines (static connections)
        this.routeGraphics = scene.add.graphics();
        this.add(this.routeGraphics);
        this.drawConnections(systems);

        // Route animation overlay (for highlighted/planned routes)
        this.routeAnimGraphics = scene.add.graphics();
        this.add(this.routeAnimGraphics);

        // Create star system entities
        for (const system of systems) {
            const entity = new StarSystemEntity(
                scene, system,
                Math.min(this.mapScaleX, this.mapScaleY)
            );
            entity.setPosition(
                GALAXY_MAP_PADDING + system.x * this.mapScaleX,
                GALAXY_MAP_PADDING + 50 + system.y * this.mapScaleY
            );

            entity.on('pointerover', () => {
                entity.setHovered(true);
                this.showTooltip(system);
            });

            entity.on('pointerout', () => {
                entity.setHovered(false);
                this.hideTooltip();
            });

            entity.on('pointerdown', () => {
                if (this.onSystemSelect) {
                    this.onSystemSelect(system.id);
                }
            });

            this.systemEntities.set(system.id, entity);
            this.add(entity as unknown as GameObjects.GameObject);
        }

        // Create tooltip container (hidden)
        this.createTooltip(scene);

        // Route info text
        this.routeInfoText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0.5);
        this.add(this.routeInfoText);

        scene.add.existing(this);
    }

    // --- Background starfield with 3 parallax layers ---
    private createParallaxStarfield(scene: Scene): void {
        const layerConfigs = [
            { count: 100, minSize: 0.3, maxSize: 0.8, minAlpha: 0.08, maxAlpha: 0.25 },   // far
            { count: 60,  minSize: 0.5, maxSize: 1.2, minAlpha: 0.15, maxAlpha: 0.45 },   // mid
            { count: 30,  minSize: 0.8, maxSize: 2.0, minAlpha: 0.25, maxAlpha: 0.7 },    // near
        ];

        const starColors = [0xffffff, 0xaabbff, 0xffddaa, 0xffaaaa, 0xaaffcc];

        for (let layer = 0; layer < layerConfigs.length; layer++) {
            const cfg = layerConfigs[layer];
            for (let i = 0; i < cfg.count; i++) {
                const x = Math.random() * GAME_WIDTH;
                const y = Math.random() * GAME_HEIGHT;
                const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
                const alpha = cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha);
                const color = starColors[Math.floor(Math.random() * starColors.length)];

                const graphic = scene.add.circle(x, y, size, color, alpha);
                this.add(graphic);

                this.bgStars.push({
                    graphic,
                    layer,
                    baseAlpha: alpha,
                    twinkleSpeed: 0.5 + Math.random() * 2,
                });
            }
        }
    }

    // --- Nebula clouds ---
    private createNebulae(scene: Scene): void {
        const nebulaColors = [0x4422aa, 0x2244aa, 0xaa2255, 0x225588, 0x663399];

        for (let i = 0; i < 5; i++) {
            const x = 100 + Math.random() * (GAME_WIDTH - 200);
            const y = 100 + Math.random() * (GAME_HEIGHT - 200);
            const radius = 80 + Math.random() * 120;
            const color = nebulaColors[i % nebulaColors.length];

            const graphic = scene.add.circle(x, y, radius, color, 0.02 + Math.random() * 0.02);
            this.add(graphic);

            this.nebulae.push({
                graphic,
                driftX: (Math.random() - 0.5) * 0.3,
                driftY: (Math.random() - 0.5) * 0.2,
                baseX: x,
                baseY: y,
            });
        }
    }

    private createTooltip(scene: Scene): void {
        this.tooltip = scene.add.container(0, 0);
        this.tooltip.setDepth(900);

        this.tooltipBg = scene.add.rectangle(0, 0, 180, 70, COLORS.panelBg, 0.92);
        this.tooltipBg.setStrokeStyle(1, COLORS.panelBorder, 0.7);
        this.tooltip.add(this.tooltipBg);

        this.tooltipName = scene.add.text(0, -22, '', {
            fontSize: '11px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);
        this.tooltip.add(this.tooltipName);

        this.tooltipInfo = scene.add.text(0, -4, '', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0);
        this.tooltip.add(this.tooltipInfo);

        this.tooltip.setVisible(false);
        this.add(this.tooltip);
    }

    private showTooltip(system: StarSystemData): void {
        if (!this.tooltip || !this.tooltipName || !this.tooltipInfo || !this.tooltipBg) return;
        if (!system.discovered) return;

        const x = GALAXY_MAP_PADDING + system.x * this.mapScaleX;
        const y = GALAXY_MAP_PADDING + 50 + system.y * this.mapScaleY;

        // Position tooltip above the star, flipping if near top
        const tooltipY = y < 130 ? y + 40 : y - 50;
        this.tooltip.setPosition(
            Math.min(Math.max(x, 100), GAME_WIDTH - 100),
            tooltipY
        );

        this.tooltipName.setText(system.name);

        const faction = system.factionId ? FACTION_MAP.get(system.factionId) : null;
        const factionStr = faction ? faction.name : 'Unclaimed';
        const dangerStr = system.dangerLevel < 0.3 ? 'Safe' :
            system.dangerLevel < 0.6 ? 'Moderate' : 'Dangerous';

        this.tooltipInfo.setText(
            `${factionStr}\n${dangerStr} | Pop: ${system.population}\n${system.industry.replace('_', ' ')}`
        );

        // Color the name by faction
        if (faction) {
            this.tooltipName.setColor('#' + faction.color.toString(16).padStart(6, '0'));
        } else {
            this.tooltipName.setColor('#' + COLORS.textHighlight.toString(16).padStart(6, '0'));
        }

        // Adjust bg height
        this.tooltipBg.setSize(180, 72);

        this.tooltip.setVisible(true);
    }

    private hideTooltip(): void {
        if (this.tooltip) {
            this.tooltip.setVisible(false);
        }
    }

    private drawConnections(systems: StarSystemData[]): void {
        this.routeGraphics.clear();

        const systemMap = new Map(systems.map(s => [s.id, s]));

        for (const system of systems) {
            for (const connId of system.connections) {
                const conn = systemMap.get(connId);
                if (!conn) continue;

                // Only draw each connection once
                if (system.id > connId) continue;

                const x1 = GALAXY_MAP_PADDING + system.x * this.mapScaleX;
                const y1 = GALAXY_MAP_PADDING + 50 + system.y * this.mapScaleY;
                const x2 = GALAXY_MAP_PADDING + conn.x * this.mapScaleX;
                const y2 = GALAXY_MAP_PADDING + 50 + conn.y * this.mapScaleY;

                const avgDanger = (system.dangerLevel + conn.dangerLevel) / 2;
                let color: number;
                let alpha: number;

                if (avgDanger < 0.3) {
                    color = COLORS.routeSafe;
                    alpha = 0.12;
                } else if (avgDanger > 0.6) {
                    color = COLORS.routeDanger;
                    alpha = 0.18;
                } else {
                    color = COLORS.routeNormal;
                    alpha = 0.12;
                }

                // Dim connections to undiscovered systems
                if (!system.discovered || !conn.discovered) {
                    alpha *= 0.25;
                }

                this.routeGraphics.lineStyle(1, color, alpha);
                this.routeGraphics.lineBetween(x1, y1, x2, y2);
            }
        }
    }

    private drawFactionTerritories(systems: StarSystemData[]): void {
        this.factionGraphics.clear();

        // Group systems by faction
        const factionSystems = new Map<string, StarSystemData[]>();
        for (const system of systems) {
            if (system.factionId) {
                const list = factionSystems.get(system.factionId) || [];
                list.push(system);
                factionSystems.set(system.factionId, list);
            }
        }

        // Draw soft faction territories as overlapping circles with glow
        for (const [factionId, fSystems] of factionSystems) {
            const faction = FACTION_MAP.get(factionId);
            if (!faction) continue;

            // Draw territory circles around each faction system
            for (const system of fSystems) {
                const x = GALAXY_MAP_PADDING + system.x * this.mapScaleX;
                const y = GALAXY_MAP_PADDING + 50 + system.y * this.mapScaleY;

                // Large soft territory marker
                this.factionGraphics.fillStyle(faction.color, 0.02);
                this.factionGraphics.fillCircle(x, y, 50);

                // Smaller, slightly brighter inner marker
                this.factionGraphics.fillStyle(faction.color, 0.03);
                this.factionGraphics.fillCircle(x, y, 25);
            }

            // Draw territory border lines between faction systems
            for (let i = 0; i < fSystems.length; i++) {
                for (let j = i + 1; j < fSystems.length; j++) {
                    const a = fSystems[i];
                    const b = fSystems[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Connect nearby faction systems with faint territory lines
                    if (dist < 250) {
                        const x1 = GALAXY_MAP_PADDING + a.x * this.mapScaleX;
                        const y1 = GALAXY_MAP_PADDING + 50 + a.y * this.mapScaleY;
                        const x2 = GALAXY_MAP_PADDING + b.x * this.mapScaleX;
                        const y2 = GALAXY_MAP_PADDING + 50 + b.y * this.mapScaleY;

                        this.factionGraphics.lineStyle(0.5, faction.color, 0.06);
                        this.factionGraphics.lineBetween(x1, y1, x2, y2);
                    }
                }
            }
        }
    }

    setSystemSelectHandler(handler: (systemId: string) => void): void {
        this.onSystemSelect = handler;
    }

    highlightSystem(systemId: string): void {
        // Deselect all
        for (const entity of this.systemEntities.values()) {
            entity.setSelected(false);
        }

        // Select target
        const entity = this.systemEntities.get(systemId);
        if (entity) {
            entity.setSelected(true);
        }
    }

    setPlayerLocation(systemId: string): void {
        for (const [id, entity] of this.systemEntities) {
            entity.setPlayerHere(id === systemId);
        }
    }

    showRoute(route: PlannedRoute | null, systems: StarSystemData[]): void {
        this.cachedSystems = systems;
        this.currentRoute = route;

        // Redraw base connections
        this.drawConnections(systems);

        if (!route) {
            this.routeInfoText.setText('');
            this.routeAnimGraphics.clear();
            return;
        }

        // Draw highlighted route with bright glow
        const systemMap = new Map(systems.map(s => [s.id, s]));

        for (let i = 0; i < route.path.length - 1; i++) {
            const from = systemMap.get(route.path[i]);
            const to = systemMap.get(route.path[i + 1]);
            if (!from || !to) continue;

            const x1 = GALAXY_MAP_PADDING + from.x * this.mapScaleX;
            const y1 = GALAXY_MAP_PADDING + 50 + from.y * this.mapScaleY;
            const x2 = GALAXY_MAP_PADDING + to.x * this.mapScaleX;
            const y2 = GALAXY_MAP_PADDING + 50 + to.y * this.mapScaleY;

            // Glow layer (wider, dimmer)
            this.routeGraphics.lineStyle(4, COLORS.textHighlight, 0.15);
            this.routeGraphics.lineBetween(x1, y1, x2, y2);

            // Bright core
            this.routeGraphics.lineStyle(2, COLORS.textHighlight, 0.8);
            this.routeGraphics.lineBetween(x1, y1, x2, y2);
        }

        // Show route info
        const dangerStr = route.totalDanger < 0.3 ? 'Safe' :
            route.totalDanger < 0.6 ? 'Moderate' : 'Dangerous';
        this.routeInfoText.setText(
            `Route: ${route.path.length - 1} jumps | ` +
            `Fuel: ${route.totalFuelCost} | ` +
            `Time: ${route.totalTravelTime} ticks | ` +
            `Danger: ${dangerStr}`
        );
    }

    discoverSystem(systemId: string): void {
        const entity = this.systemEntities.get(systemId);
        if (entity) {
            entity.discover();
        }
    }

    // --- Shooting star spawning ---
    private spawnShootingStar(): void {
        const graphics = this.scene.add.graphics();
        this.addAt(graphics, this.nebulae.length + this.bgStars.length);

        const star: ShootingStar = {
            graphic: graphics,
            x: Math.random() * GAME_WIDTH * 0.8,
            y: Math.random() * GAME_HEIGHT * 0.3 + 30,
            angle: 0.3 + Math.random() * 0.5, // downward-right angle
            speed: 300 + Math.random() * 200,
            life: 0,
            maxLife: 0.6 + Math.random() * 0.4,
        };
        this.shootingStars.push(star);
    }

    update(time: number, delta: number): void {
        const dt = delta * 0.001;

        // --- Update star system entities ---
        for (const entity of this.systemEntities.values()) {
            entity.update(time, delta);
        }

        // --- Twinkle background stars ---
        for (const star of this.bgStars) {
            const t = time * 0.001 * star.twinkleSpeed;
            const twinkle = star.baseAlpha + Math.sin(t + star.graphic.x * 0.1) * star.baseAlpha * 0.3;
            star.graphic.setAlpha(Math.max(0.02, twinkle));
        }

        // --- Drift nebulae ---
        for (const nebula of this.nebulae) {
            const t = time * 0.001;
            nebula.graphic.setPosition(
                nebula.baseX + Math.sin(t * nebula.driftX) * 15,
                nebula.baseY + Math.cos(t * nebula.driftY) * 10
            );
        }

        // --- Shooting stars (rare: ~every 12 seconds) ---
        this.shootingStarTimer += dt;
        if (this.shootingStarTimer > 10 + Math.random() * 5) {
            this.shootingStarTimer = 0;
            this.spawnShootingStar();
        }

        // Update existing shooting stars
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const star = this.shootingStars[i];
            star.life += dt;

            if (star.life >= star.maxLife) {
                star.graphic.destroy();
                this.shootingStars.splice(i, 1);
                continue;
            }

            const progress = star.life / star.maxLife;
            const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
            const tailLength = 30 + progress * 40;

            star.x += Math.cos(star.angle) * star.speed * dt;
            star.y += Math.sin(star.angle) * star.speed * dt;

            star.graphic.clear();
            star.graphic.lineStyle(1.5, 0xffffff, alpha * 0.8);
            star.graphic.lineBetween(
                star.x, star.y,
                star.x - Math.cos(star.angle) * tailLength,
                star.y - Math.sin(star.angle) * tailLength
            );
            // Faint glow around the head
            star.graphic.fillStyle(0xaaddff, alpha * 0.2);
            star.graphic.fillCircle(star.x, star.y, 2);
        }

        // --- Animated route dashes ---
        if (this.currentRoute) {
            this.routeAnimTimer += dt;
            this.routeAnimGraphics.clear();

            const systemMap = new Map(this.cachedSystems.map(s => [s.id, s]));

            for (let i = 0; i < this.currentRoute.path.length - 1; i++) {
                const from = systemMap.get(this.currentRoute.path[i]);
                const to = systemMap.get(this.currentRoute.path[i + 1]);
                if (!from || !to) continue;

                const x1 = GALAXY_MAP_PADDING + from.x * this.mapScaleX;
                const y1 = GALAXY_MAP_PADDING + 50 + from.y * this.mapScaleY;
                const x2 = GALAXY_MAP_PADDING + to.x * this.mapScaleX;
                const y2 = GALAXY_MAP_PADDING + 50 + to.y * this.mapScaleY;

                // Draw flowing dashes along route
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const dashLen = 8;
                const gapLen = 12;
                const cycle = dashLen + gapLen;
                const offset = (this.routeAnimTimer * 40) % cycle;

                const nx = dx / length;
                const ny = dy / length;

                let d = -offset;
                while (d < length) {
                    const start = Math.max(0, d);
                    const end = Math.min(length, d + dashLen);

                    if (end > start) {
                        const sx = x1 + nx * start;
                        const sy = y1 + ny * start;
                        const ex = x1 + nx * end;
                        const ey = y1 + ny * end;

                        this.routeAnimGraphics.lineStyle(1.5, 0xffffff, 0.5);
                        this.routeAnimGraphics.lineBetween(sx, sy, ex, ey);
                    }
                    d += cycle;
                }
            }
        }
    }
}
