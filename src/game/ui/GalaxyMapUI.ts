// ============================================================
// Star Routes - Galaxy Map UI
// Interactive galaxy map: clickable stars, routes, factions
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { StarSystemData } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GALAXY_MAP_PADDING } from '../config/constants';
import { FACTION_MAP } from '../config/faction-data';
import { StarSystemEntity } from '../entities/StarSystem';
import { PlannedRoute } from '../systems/NavigationSystem';

export class GalaxyMapUI extends GameObjects.Container {
    private systemEntities: Map<string, StarSystemEntity> = new Map();
    private routeGraphics: GameObjects.Graphics;
    private factionGraphics: GameObjects.Graphics;
    private routeInfoText: GameObjects.Text;
    private onSystemSelect: ((systemId: string) => void) | null = null;
    private mapScaleX: number;
    private mapScaleY: number;

    constructor(
        scene: Scene,
        systems: StarSystemData[]
    ) {
        super(scene, 0, 0);

        // Calculate scale to fit galaxy in the view
        const viewWidth = GAME_WIDTH - GALAXY_MAP_PADDING * 2;
        const viewHeight = GAME_HEIGHT - GALAXY_MAP_PADDING * 2 - 60; // room for HUD
        this.mapScaleX = viewWidth / 1000;
        this.mapScaleY = viewHeight / 700;

        // Faction territory background
        this.factionGraphics = scene.add.graphics();
        this.add(this.factionGraphics);
        this.drawFactionTerritories(systems);

        // Route lines
        this.routeGraphics = scene.add.graphics();
        this.add(this.routeGraphics);
        this.drawConnections(systems);

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
            });

            entity.on('pointerout', () => {
                entity.setHovered(false);
            });

            entity.on('pointerdown', () => {
                if (this.onSystemSelect) {
                    this.onSystemSelect(system.id);
                }
            });

            this.systemEntities.set(system.id, entity);
            this.add(entity as unknown as GameObjects.GameObject);
        }

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
                    alpha = 0.15;
                } else if (avgDanger > 0.6) {
                    color = COLORS.routeDanger;
                    alpha = 0.2;
                } else {
                    color = COLORS.routeNormal;
                    alpha = 0.15;
                }

                // Dim connections to undiscovered systems
                if (!system.discovered || !conn.discovered) {
                    alpha *= 0.3;
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

        // Draw soft faction territories as overlapping circles
        for (const [factionId, fSystems] of factionSystems) {
            const faction = FACTION_MAP.get(factionId);
            if (!faction) continue;

            for (const system of fSystems) {
                const x = GALAXY_MAP_PADDING + system.x * this.mapScaleX;
                const y = GALAXY_MAP_PADDING + 50 + system.y * this.mapScaleY;

                this.factionGraphics.fillStyle(faction.color, 0.03);
                this.factionGraphics.fillCircle(x, y, 40);
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
        // Redraw connections first
        this.drawConnections(systems);

        if (!route) {
            this.routeInfoText.setText('');
            return;
        }

        // Draw highlighted route
        const systemMap = new Map(systems.map(s => [s.id, s]));

        for (let i = 0; i < route.path.length - 1; i++) {
            const from = systemMap.get(route.path[i]);
            const to = systemMap.get(route.path[i + 1]);
            if (!from || !to) continue;

            const x1 = GALAXY_MAP_PADDING + from.x * this.mapScaleX;
            const y1 = GALAXY_MAP_PADDING + 50 + from.y * this.mapScaleY;
            const x2 = GALAXY_MAP_PADDING + to.x * this.mapScaleX;
            const y2 = GALAXY_MAP_PADDING + 50 + to.y * this.mapScaleY;

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

    update(time: number, delta: number): void {
        for (const entity of this.systemEntities.values()) {
            entity.update(time, delta);
        }
    }
}
