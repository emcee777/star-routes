// ============================================================
// Star Routes - Station Scene
// Docked at a station: trading, hiring, repairs, shipyard, map
// ============================================================

import { Scene } from 'phaser';
import {
    GameState, PlayerState, StarSystemData, PlayerShip,
    FactionReputation, GameSettings
} from '../types';
import { COLORS, GAME_WIDTH, GAME_VERSION, DAY_LENGTH_TICKS, AUTO_SAVE_INTERVAL } from '../config/constants';
import { generateGalaxy } from '../systems/GalaxyGenerator';
import { EconomyEngine } from '../systems/EconomyEngine';
import { TradingSystem } from '../systems/TradingSystem';
import { NavigationSystem, PlannedRoute } from '../systems/NavigationSystem';
import { CrewManager } from '../systems/CrewManager';
import { ReputationSystem } from '../systems/ReputationSystem';
import { ShipManager } from '../systems/ShipManager';
import { SaveSystem } from '../systems/SaveSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { HUD } from '../ui/HUD';
import { StationUI, StationTab } from '../ui/StationUI';
import { TradingPanel } from '../ui/TradingPanel';
import { ShipPanel } from '../ui/ShipPanel';
import { CrewPanel } from '../ui/CrewPanel';
import { GalaxyMapUI } from '../ui/GalaxyMapUI';
import { TravelPanel } from '../ui/TravelPanel';
import { LogUI } from '../ui/LogUI';
import { FACTION_MAP } from '../config/faction-data';

export class StationScene extends Scene {
    // Systems
    private economyEngine!: EconomyEngine;
    private tradingSystem!: TradingSystem;
    private navSystem!: NavigationSystem;
    private crewManager!: CrewManager;
    private reputationSystem!: ReputationSystem;
    private shipManager!: ShipManager;
    private saveSystem!: SaveSystem;
    private timeSystem!: TimeSystem;

    // Game state
    private gameState!: GameState;
    private player!: PlayerState;
    private galaxy!: StarSystemData[];

    // UI
    private hud!: HUD;
    private stationUI!: StationUI;
    private tradingPanel!: TradingPanel;
    private shipPanel!: ShipPanel;
    private crewPanel!: CrewPanel;
    private galaxyMap!: GalaxyMapUI;
    private travelPanel!: TravelPanel;
    private logUI!: LogUI;

    // State
    private autoSaveTimer: number = 0;

    constructor() {
        super('StationScene');
    }

    init(data: {
        newGame?: boolean;
        loadSave?: boolean;
        playerName?: string;
        ship?: PlayerShip;
        startingCredits?: number;
        gameState?: GameState;
    }): void {
        // Initialize all systems
        this.economyEngine = new EconomyEngine();
        this.tradingSystem = new TradingSystem(this.economyEngine);
        this.navSystem = new NavigationSystem();
        this.crewManager = new CrewManager();
        this.reputationSystem = new ReputationSystem();
        this.shipManager = new ShipManager();
        this.saveSystem = new SaveSystem();
        this.timeSystem = new TimeSystem();

        if (data.gameState) {
            // Coming back from travel/combat with existing state
            this.gameState = data.gameState;
            this.player = this.gameState.player;
            this.galaxy = this.gameState.galaxy;
            this.timeSystem.loadState(this.gameState);
            this.economyEngine.loadSnapshots(this.gameState.economyHistory);
        } else if (data.loadSave) {
            const saved = this.saveSystem.load('auto');
            if (saved) {
                this.gameState = saved;
                this.player = saved.player;
                this.galaxy = saved.galaxy;
                this.timeSystem.loadState(saved);
                this.economyEngine.loadSnapshots(saved.economyHistory);
            } else {
                this.createNewGame('Captain', undefined, 5000);
            }
        } else if (data.newGame && data.ship) {
            this.createNewGame(data.playerName ?? 'Captain', data.ship, data.startingCredits ?? 5000);
        } else {
            this.createNewGame('Captain', undefined, 5000);
        }
    }

    private createNewGame(name: string, ship?: PlayerShip, credits: number = 5000): void {
        const seed = Date.now();
        this.galaxy = generateGalaxy(seed);

        if (!ship) {
            ship = this.shipManager.createShip('swift_courier', 'Swift Courier')!;
        }

        const factionRep: FactionReputation[] = this.reputationSystem.initializeReputations();

        this.player = {
            name,
            credits,
            ship,
            crew: [],
            factionRep,
            currentSystemId: this.galaxy[0].id,
            totalProfit: 0,
            totalTrades: 0,
            systemsVisited: [this.galaxy[0].id],
            daysSurvived: 0,
            cargoSold: 0,
            piratesDefeated: 0,
            crewHired: 0,
            isInTransit: false,
            transitProgress: 0,
            transitRoute: null,
        };

        const settings: GameSettings = {
            musicVolume: 0.5,
            sfxVolume: 0.7,
            autoSave: true,
            difficulty: 'normal',
        };

        this.gameState = {
            player: this.player,
            galaxy: this.galaxy,
            gameTime: 0,
            gameDayLength: DAY_LENGTH_TICKS,
            eventLog: [],
            settings,
            economyHistory: [],
            activeEvents: [],
            savedAt: Date.now(),
            version: GAME_VERSION,
        };

        // Welcome log
        this.gameState.eventLog.push({
            time: 0,
            type: 'system',
            message: `Captain ${name}, welcome to the stars. Your journey begins at ${this.galaxy[0].name}.`,
        });
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Apply bloom post-processing if available
        const renderer = this.renderer;
        if (renderer && 'pipelines' in renderer) {
            try {
                this.cameras.main.setPostPipeline('BloomPipeline');
            } catch (_e) {
                // WebGL pipeline not available (Canvas mode)
            }
        }

        const currentSystem = this.getCurrentSystem();

        // Create UI components
        this.hud = new HUD(this);
        this.stationUI = new StationUI(this);
        this.logUI = new LogUI(this);

        this.tradingPanel = new TradingPanel(this, this.tradingSystem);
        this.shipPanel = new ShipPanel(this, this.shipManager);
        this.crewPanel = new CrewPanel(this, this.crewManager);
        this.galaxyMap = new GalaxyMapUI(this, this.galaxy);
        this.travelPanel = new TravelPanel(this, this.navSystem);

        // Set up station info
        const faction = currentSystem.factionId ? FACTION_MAP.get(currentSystem.factionId) : null;
        this.stationUI.setSystemInfo(
            currentSystem.name,
            currentSystem.description,
            faction?.name ?? null
        );

        // Generate available crew
        const systemSeed = parseInt(currentSystem.id.replace('sys_', ''));
        const availableCrew = this.crewManager.generateAvailableCrew(
            this.timeSystem.currentTime, systemSeed, 3
        );
        this.crewPanel.setAvailableCrew(availableCrew);

        // Set up tab handling
        this.stationUI.setTabChangeHandler((tab: StationTab) => {
            this.switchTab(tab);
        });

        // Set up trading handlers
        this.tradingPanel.setTradeHandler(() => {
            this.refreshUI();
        });

        // Set up ship panel handlers
        this.shipPanel.setUpdateHandler(() => {
            this.refreshUI();
        });

        // Set up crew panel handlers
        this.crewPanel.setUpdateHandler(() => {
            this.refreshUI();
        });

        // Set up galaxy map handlers
        this.galaxyMap.setSystemSelectHandler((systemId: string) => {
            this.onSystemSelected(systemId);
        });
        this.galaxyMap.setPlayerLocation(this.player.currentSystemId);

        // Set up travel handlers
        this.travelPanel.setTravelHandler((route: PlannedRoute) => {
            this.startTravel(route);
        });

        // Initial tab
        this.switchTab('trade');

        // Update displays
        this.refreshUI();

        // Auto-save
        this.saveSystem.autoSave(this.gameState);
    }

    private switchTab(tab: StationTab): void {
        this.tradingPanel.setVisible(tab === 'trade');
        this.shipPanel.setVisible(tab === 'ship');
        this.crewPanel.setVisible(tab === 'crew');
        this.galaxyMap.setVisible(tab === 'map');
        this.travelPanel.setVisible(false);

        if (tab === 'repairs') {
            // Auto-repair and refuel
            this.handleRepairs();
            this.tradingPanel.setVisible(false);
        }

        this.refreshUI();
    }

    private handleRepairs(): void {
        const currentSystem = this.getCurrentSystem();

        // Clear any existing repair UI
        const repairContainer = this.add.container(0, 0);
        repairContainer.setDepth(200);

        const title = this.add.text(GAME_WIDTH / 2, 100, `REPAIRS & SERVICES at ${currentSystem.name}`, {
            fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);
        repairContainer.add(title);

        const repairCost = this.shipManager.getRepairCost(this.player.ship);
        const refuelCost = this.shipManager.getRefuelCost(this.player.ship);

        // Repair button
        if (repairCost > 0) {
            this.createServiceButton(repairContainer, GAME_WIDTH / 2, 170,
                `FULL REPAIR (${repairCost} credits)`,
                this.player.credits >= repairCost ? COLORS.hullBar : COLORS.negative,
                () => {
                    this.shipManager.repair(this.player, this.player.ship.maxHull,
                        this.gameState.eventLog, this.timeSystem.currentTime);
                    this.refreshUI();
                    repairContainer.destroy();
                    this.handleRepairs();
                }
            );
        } else {
            this.add.text(GAME_WIDTH / 2, 170, 'Hull at full health', {
                fontSize: '12px', fontFamily: 'monospace',
                color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);
        }

        // Refuel button
        if (refuelCost > 0) {
            this.createServiceButton(repairContainer, GAME_WIDTH / 2, 230,
                `FULL REFUEL (${refuelCost} credits)`,
                this.player.credits >= refuelCost ? COLORS.fuelBar : COLORS.negative,
                () => {
                    this.shipManager.refuel(this.player, this.player.ship.maxFuel,
                        this.gameState.eventLog, this.timeSystem.currentTime);
                    this.refreshUI();
                    repairContainer.destroy();
                    this.handleRepairs();
                }
            );
        } else {
            this.add.text(GAME_WIDTH / 2, 230, 'Fuel tanks full', {
                fontSize: '12px', fontFamily: 'monospace',
                color: '#' + COLORS.positive.toString(16).padStart(6, '0'),
            }).setOrigin(0.5, 0.5);
        }

        // Ship stats display
        const ship = this.player.ship;
        this.add.text(GAME_WIDTH / 2, 300, [
            `Hull: ${ship.hull}/${ship.maxHull}`,
            `Shield: ${ship.shield}/${ship.maxShield}`,
            `Fuel: ${ship.fuel}/${ship.maxFuel}`,
            `Credits: ${this.player.credits}`,
        ].join('\n'), {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0);
    }

    private createServiceButton(
        container: Phaser.GameObjects.Container,
        x: number, y: number,
        label: string, color: number,
        onClick: () => void
    ): void {
        const bg = this.add.rectangle(x, y, 300, 36, color, 0.2);
        bg.setStrokeStyle(1, color, 0.6);
        container.add(bg);

        const text = this.add.text(x, y, label, {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);
        container.add(text);

        bg.setInteractive();
        bg.on('pointerdown', onClick);
        bg.on('pointerover', () => bg.setFillStyle(color, 0.4));
        bg.on('pointerout', () => bg.setFillStyle(color, 0.2));
    }

    private onSystemSelected(systemId: string): void {
        this.galaxyMap.highlightSystem(systemId);

        if (systemId === this.player.currentSystemId) return;

        const fromSystem = this.getCurrentSystem();
        const toSystem = this.galaxy.find(s => s.id === systemId);
        if (!toSystem) return;

        // Show route in galaxy map
        const route = this.navSystem.findShortestPath(
            this.player.currentSystemId, systemId, this.galaxy, this.player.ship
        );
        this.galaxyMap.showRoute(route, this.galaxy);

        // Show travel panel
        this.travelPanel.showRouteOptions(this.player, fromSystem, toSystem, this.galaxy);
        this.travelPanel.setVisible(true);
    }

    private startTravel(route: PlannedRoute): void {
        // Consume fuel
        this.player.ship.fuel -= route.totalFuelCost;
        this.player.isInTransit = true;
        this.player.transitRoute = route.legs[0];

        this.gameState.eventLog.push({
            time: this.timeSystem.currentTime,
            type: 'travel',
            message: `Departing ${this.getCurrentSystem().name}...`,
        });

        // Save state
        this.timeSystem.saveToState(this.gameState);
        this.gameState.economyHistory = this.economyEngine.economyHistory;

        // Switch to travel scene
        this.scene.start('TravelScene', {
            gameState: this.gameState,
            route,
        });
    }

    private refreshUI(): void {
        const currentSystem = this.getCurrentSystem();
        this.hud.updateDisplay(this.player, currentSystem.name, this.timeSystem);
        this.logUI.updateEntries(this.gameState.eventLog);

        const activeTab = this.stationUI.getActiveTab();
        if (activeTab === 'trade') {
            this.tradingPanel.updateTradingDisplay(this.player, currentSystem, this.timeSystem.currentTime);
        } else if (activeTab === 'ship') {
            this.shipPanel.updateDisplay(this.player, this.timeSystem.currentTime);
        } else if (activeTab === 'crew') {
            this.crewPanel.updateDisplay(this.player, this.timeSystem.currentTime);
        }
    }

    private getCurrentSystem(): StarSystemData {
        return this.galaxy.find(s => s.id === this.player.currentSystemId)!;
    }

    update(time: number, delta: number): void {
        this.galaxyMap.update(time, delta);

        // Auto-save periodically
        this.autoSaveTimer += delta;
        if (this.autoSaveTimer > AUTO_SAVE_INTERVAL * 1000) {
            this.autoSaveTimer = 0;
            this.timeSystem.saveToState(this.gameState);
            this.gameState.economyHistory = this.economyEngine.economyHistory;
            this.saveSystem.autoSave(this.gameState);
        }
    }
}
