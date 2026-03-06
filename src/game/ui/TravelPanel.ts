// ============================================================
// Star Routes - Travel Panel
// Route selection: multiple paths with distance, danger, time
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { PlayerState, StarSystemData } from '../types';
import { COLORS, GAME_WIDTH } from '../config/constants';
import { NavigationSystem, PlannedRoute } from '../systems/NavigationSystem';

export class TravelPanel extends GameObjects.Container {
    private navSystem: NavigationSystem;
    private contentContainer: GameObjects.Container;
    private onTravel: ((route: PlannedRoute) => void) | null = null;

    constructor(scene: Scene, navSystem: NavigationSystem) {
        super(scene, 0, 0);
        this.navSystem = navSystem;
        this.setDepth(200);

        this.contentContainer = scene.add.container(0, 0);
        this.add(this.contentContainer);

        scene.add.existing(this);
    }

    setTravelHandler(handler: (route: PlannedRoute) => void): void {
        this.onTravel = handler;
    }

    showRouteOptions(
        player: PlayerState,
        fromSystem: StarSystemData,
        toSystem: StarSystemData,
        allSystems: StarSystemData[]
    ): void {
        this.contentContainer.removeAll(true);
        const scene = this.contentContainer.scene;

        // Title
        const title = scene.add.text(GAME_WIDTH / 2, 100, `ROUTES: ${fromSystem.name} -> ${toSystem.name}`, {
            fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);
        this.contentContainer.add(title);

        // Calculate three route options
        const routes: Array<{ name: string; route: PlannedRoute | null; description: string }> = [
            {
                name: 'SHORTEST',
                route: this.navSystem.findShortestPath(fromSystem.id, toSystem.id, allSystems, player.ship),
                description: 'Fastest route. May pass through dangerous territory.',
            },
            {
                name: 'SAFEST',
                route: this.navSystem.findSafestPath(fromSystem.id, toSystem.id, allSystems, player.ship),
                description: 'Avoids danger zones. Longer but safer.',
            },
            {
                name: 'EFFICIENT',
                route: this.navSystem.findEfficientPath(fromSystem.id, toSystem.id, allSystems, player.ship),
                description: 'Minimizes fuel consumption.',
            },
        ];

        let y = 140;
        for (const option of routes) {
            if (!option.route) continue;

            const route = option.route;

            // Route card background
            const cardHeight = 80;
            const bg = scene.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, GAME_WIDTH - 100, cardHeight, COLORS.panelBg, 0.8);
            bg.setStrokeStyle(1, COLORS.panelBorder, 0.5);
            this.contentContainer.add(bg);

            // Route name
            const nameText = scene.add.text(70, y + 10, option.name, {
                fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(nameText);

            // Description
            const desc = scene.add.text(70, y + 28, option.description, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            });
            this.contentContainer.add(desc);

            // Stats
            const dangerColor = route.totalDanger < 0.3 ? COLORS.positive :
                route.totalDanger < 0.6 ? COLORS.warning : COLORS.negative;
            const dangerStr = route.totalDanger < 0.3 ? 'Safe' :
                route.totalDanger < 0.6 ? 'Moderate' : 'Dangerous';

            const statsText = scene.add.text(70, y + 45,
                `Jumps: ${route.path.length - 1}  |  Fuel: ${route.totalFuelCost}  |  Time: ${route.totalTravelTime}  |  Danger: ${dangerStr}`, {
                    fontSize: '10px', fontFamily: 'monospace',
                    color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
                });
            this.contentContainer.add(statsText);

            // Danger color indicator
            const dangerDot = scene.add.circle(60, y + 48, 4, dangerColor);
            this.contentContainer.add(dangerDot);

            // Can afford fuel?
            const canAfford = player.ship.fuel >= route.totalFuelCost;

            // Travel button
            const btnColor = canAfford ? COLORS.positive : COLORS.negative;
            const btnLabel = canAfford ? 'TRAVEL' : 'NO FUEL';

            const travelBtn = scene.add.container(GAME_WIDTH - 120, y + cardHeight / 2);
            const btnBg = scene.add.rectangle(0, 0, 70, 28, btnColor, canAfford ? 0.3 : 0.1);
            btnBg.setStrokeStyle(1, btnColor, 0.6);
            travelBtn.add(btnBg);

            const btnText = scene.add.text(0, 0, btnLabel, {
                fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#' + btnColor.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);
            travelBtn.add(btnText);

            if (canAfford) {
                travelBtn.setSize(70, 28);
                travelBtn.setInteractive();
                travelBtn.on('pointerdown', () => {
                    if (this.onTravel) this.onTravel(route);
                });
                travelBtn.on('pointerover', () => btnBg.setFillStyle(btnColor, 0.5));
                travelBtn.on('pointerout', () => btnBg.setFillStyle(btnColor, 0.3));
            }

            this.contentContainer.add(travelBtn);

            y += cardHeight + 10;
        }

        // Back button
        const backBtn = scene.add.container(GAME_WIDTH / 2, y + 20);
        const backBg = scene.add.rectangle(0, 0, 100, 30, COLORS.panelBg, 0.8);
        backBg.setStrokeStyle(1, COLORS.textSecondary, 0.5);
        backBtn.add(backBg);

        const backText = scene.add.text(0, 0, 'BACK', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        backBtn.add(backText);

        backBtn.setSize(100, 30);
        backBtn.setInteractive();
        backBtn.on('pointerdown', () => {
            this.setVisible(false);
        });

        this.contentContainer.add(backBtn);
    }
}
