// ============================================================
// Star Routes - Travel Scene
// In transit: animated travel with random events, encounters
// ============================================================

import { Scene, GameObjects } from 'phaser';
import { GameState, StarSystemData, CombatState } from '../types';
import {
    COLORS, GAME_WIDTH, GAME_HEIGHT, GAME_TICK_MS, DAY_LENGTH_TICKS,
    VICTORY_CREDITS, VICTORY_SYSTEMS, VICTORY_TRADES
} from '../config/constants';
import { PlannedRoute } from '../systems/NavigationSystem';
import { EconomyEngine } from '../systems/EconomyEngine';
import { EventSystem } from '../systems/EventSystem';
import { CrewManager } from '../systems/CrewManager';
import { CombatSystem } from '../systems/CombatSystem';
import { ShipManager } from '../systems/ShipManager';
import { TimeSystem } from '../systems/TimeSystem';
import { ReputationSystem } from '../systems/ReputationSystem';
import { ShipEntity } from '../entities/Ship';
import { EventPanel } from '../ui/EventPanel';
import { CombatUI } from '../ui/CombatUI';

export class TravelScene extends Scene {
    private gameState!: GameState;
    private route!: PlannedRoute;
    private currentLeg: number = 0;
    private legProgress: number = 0;
    private travelTimer: number = 0;

    // Systems
    private economyEngine!: EconomyEngine;
    private eventSystem!: EventSystem;
    private crewManager!: CrewManager;
    private combatSystem!: CombatSystem;
    private shipManager!: ShipManager;
    private timeSystem!: TimeSystem;
    private reputationSystem!: ReputationSystem;

    // Visual elements
    private shipEntity!: ShipEntity;
    private fromDot!: GameObjects.Arc;
    private toDot!: GameObjects.Arc;
    private routeLine!: GameObjects.Graphics;
    private progressText!: GameObjects.Text;
    private systemNameText!: GameObjects.Text;
    private statusText!: GameObjects.Text;

    // UI overlays
    private eventPanel!: EventPanel;
    private combatUI!: CombatUI;

    // State
    private isPaused: boolean = false;
    private combatState: CombatState | null = null;
    private travelComplete: boolean = false;

    // Background stars
    private bgStars: GameObjects.Arc[] = [];

    constructor() {
        super('TravelScene');
    }

    init(data: { gameState: GameState; route: PlannedRoute }): void {
        this.gameState = data.gameState;
        this.route = data.route;
        this.currentLeg = 0;
        this.legProgress = 0;
        this.travelTimer = 0;
        this.isPaused = false;
        this.combatState = null;
        this.travelComplete = false;

        // Initialize systems
        this.economyEngine = new EconomyEngine();
        this.crewManager = new CrewManager();
        this.eventSystem = new EventSystem(this.crewManager);
        this.combatSystem = new CombatSystem();
        this.shipManager = new ShipManager();
        this.timeSystem = new TimeSystem();
        this.reputationSystem = new ReputationSystem();

        this.timeSystem.loadState(this.gameState);
        this.economyEngine.loadSnapshots(this.gameState.economyHistory);
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Background starfield
        for (let i = 0; i < 200; i++) {
            const star = this.add.circle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                0.5 + Math.random() * 1.5,
                0xffffff,
                0.1 + Math.random() * 0.5
            );
            this.bgStars.push(star);
        }

        // Route visualization
        this.routeLine = this.add.graphics();
        this.routeLine.lineStyle(2, COLORS.routeNormal, 0.3);
        this.routeLine.lineBetween(200, GAME_HEIGHT / 2, GAME_WIDTH - 200, GAME_HEIGHT / 2);

        // Draw traveled portion
        this.routeLine.lineStyle(2, COLORS.textHighlight, 0.6);
        this.routeLine.lineBetween(200, GAME_HEIGHT / 2, 200, GAME_HEIGHT / 2);

        // From/To dots
        this.fromDot = this.add.circle(200, GAME_HEIGHT / 2, 8, COLORS.positive, 0.8);
        this.fromDot.setStrokeStyle(2, COLORS.positive);

        this.toDot = this.add.circle(GAME_WIDTH - 200, GAME_HEIGHT / 2, 8, COLORS.textHighlight, 0.8);
        this.toDot.setStrokeStyle(2, COLORS.textHighlight);

        // Ship
        this.shipEntity = new ShipEntity(this, 200, GAME_HEIGHT / 2 - 30, this.gameState.player.ship);
        this.shipEntity.setMoving(true, -Math.PI / 2);

        // System names
        const fromSystem = this.getSystem(this.route.path[0]);
        const toSystem = this.getSystem(this.route.path[this.route.path.length - 1]);

        this.add.text(200, GAME_HEIGHT / 2 + 30, fromSystem?.name ?? '???', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);

        this.add.text(GAME_WIDTH - 200, GAME_HEIGHT / 2 + 30, toSystem?.name ?? '???', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);

        // Progress text
        this.progressText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '', {
            fontSize: '14px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0);

        // System name being traveled to
        this.systemNameText = this.add.text(GAME_WIDTH / 2, 100, 'IN TRANSIT', {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5);

        // Status text
        this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0.5);

        // Ship stats display
        this.add.text(20, 20, `Hull: ${this.gameState.player.ship.hull}/${this.gameState.player.ship.maxHull}`, {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.hullBar.toString(16).padStart(6, '0'),
        });
        this.add.text(20, 38, `Fuel: ${this.gameState.player.ship.fuel}/${this.gameState.player.ship.maxFuel}`, {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.fuelBar.toString(16).padStart(6, '0'),
        });
        this.add.text(GAME_WIDTH - 20, 20, this.timeSystem.formatTime(), {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0);

        // Create event panel (hidden)
        this.eventPanel = new EventPanel(this);
        this.eventPanel.setVisible(false);
        this.eventPanel.setChoiceHandler((choiceIndex) => this.handleEventChoice(choiceIndex));
        this.eventPanel.setContinueHandler(() => this.handleEventContinue());

        // Create combat UI (hidden)
        this.combatUI = new CombatUI(this);
        this.combatUI.setVisible(false);
        this.combatUI.setActionHandler((action) => this.handleCombatAction(action));
        this.combatUI.setContinueHandler(() => this.handleCombatEnd());
    }

    update(_time: number, delta: number): void {
        if (this.isPaused || this.travelComplete) return;

        // Animate stars
        for (const star of this.bgStars) {
            star.x -= delta * 0.05;
            if (star.x < 0) star.x = GAME_WIDTH;
        }

        // Update ship animation
        this.shipEntity.update(_time, delta);

        // Travel tick
        this.travelTimer += delta;
        if (this.travelTimer >= GAME_TICK_MS) {
            this.travelTimer -= GAME_TICK_MS;
            this.processTravelTick();
        }
    }

    private processTravelTick(): void {
        if (this.currentLeg >= this.route.legs.length) {
            this.arriveAtDestination();
            return;
        }

        const leg = this.route.legs[this.currentLeg];
        this.legProgress++;
        this.timeSystem.tick();

        // Update economy
        this.economyEngine.update(this.gameState.galaxy, this.gameState.activeEvents);
        this.eventSystem.updateActiveEvents(this.gameState.activeEvents);

        // Apply module repairs during travel
        this.shipManager.applyModuleRepair(this.gameState.player.ship);

        // Daily updates
        if (this.timeSystem.currentTime % DAY_LENGTH_TICKS === 0) {
            this.gameState.player.daysSurvived++;
            this.crewManager.dailyUpdate(this.gameState.player, this.gameState.eventLog, this.timeSystem.currentTime);
            this.crewManager.paySalaries(this.gameState.player, this.timeSystem.currentTime, this.gameState.eventLog);
        }

        // Check for random events
        const currentSys = this.getSystem(leg.from);
        const event = this.eventSystem.checkForEvent(
            leg.dangerLevel,
            this.gameState.player,
            currentSys ?? null,
            true
        );

        if (event) {
            this.isPaused = true;
            const choices = this.eventSystem.getAvailableChoices(event, this.gameState.player);
            this.eventPanel.showEvent(event, choices);
            this.eventPanel.setVisible(true);
            this.currentEventDef = event;
            return;
        }

        // Update visual progress
        const totalTicks = this.route.totalTravelTime;
        const completedTicks = this.route.legs.slice(0, this.currentLeg)
            .reduce((sum, l) => sum + l.travelTime, 0) + this.legProgress;
        const overallProgress = completedTicks / totalTicks;

        // Move ship
        const shipX = 200 + (GAME_WIDTH - 400) * overallProgress;
        this.shipEntity.setPosition(shipX, GAME_HEIGHT / 2 - 30);

        // Update progress line
        this.routeLine.clear();
        this.routeLine.lineStyle(2, COLORS.routeNormal, 0.3);
        this.routeLine.lineBetween(200, GAME_HEIGHT / 2, GAME_WIDTH - 200, GAME_HEIGHT / 2);
        this.routeLine.lineStyle(2, COLORS.textHighlight, 0.6);
        this.routeLine.lineBetween(200, GAME_HEIGHT / 2, shipX, GAME_HEIGHT / 2);

        this.progressText.setText(
            `Jump ${this.currentLeg + 1}/${this.route.legs.length} | ` +
            `${Math.round(overallProgress * 100)}% complete`
        );

        // Check if current leg is done
        if (this.legProgress >= leg.travelTime) {
            this.currentLeg++;
            this.legProgress = 0;

            if (this.currentLeg < this.route.legs.length) {
                // Arrive at intermediate system
                const nextSystemId = this.route.path[this.currentLeg];
                const nextSystem = this.getSystem(nextSystemId);
                if (nextSystem) {
                    // Discover system
                    if (!nextSystem.discovered) {
                        nextSystem.discovered = true;
                        this.gameState.eventLog.push({
                            time: this.timeSystem.currentTime,
                            type: 'system',
                            message: `Discovered ${nextSystem.name}!`,
                        });
                    }
                    this.statusText.setText(`Passing through ${nextSystem.name}...`);
                }
            }
        }
    }

    private currentEventDef: import('../types').GameEventDef | null = null;

    private handleEventChoice(choiceIndex: number): void {
        if (!this.currentEventDef) return;

        const choice = this.currentEventDef.choices[choiceIndex];
        const outcome = this.eventSystem.resolveChoice(choice);

        const result = this.eventSystem.applyOutcome(
            outcome,
            this.gameState.player,
            this.gameState.eventLog,
            this.timeSystem.currentTime,
            this.gameState.activeEvents,
            this.gameState.player.currentSystemId
        );

        this.gameState.eventLog.push({
            time: this.timeSystem.currentTime,
            type: 'event',
            message: `${this.currentEventDef.name}: ${outcome.text}`,
        });

        this.eventPanel.showOutcome(outcome.text);

        if (result.startCombat) {
            // Start combat after event
            this.pendingCombat = true;
        }

        if (result.discoveredSystem) {
            // Discover a random undiscovered system
            const undiscovered = this.gameState.galaxy.find(s => !s.discovered);
            if (undiscovered) {
                undiscovered.discovered = true;
                this.gameState.eventLog.push({
                    time: this.timeSystem.currentTime,
                    type: 'system',
                    message: `Discovered ${undiscovered.name}!`,
                });
            }
        }
    }

    private pendingCombat: boolean = false;

    private handleEventContinue(): void {
        this.eventPanel.setVisible(false);
        this.currentEventDef = null;

        if (this.pendingCombat) {
            this.pendingCombat = false;
            this.startCombat();
        } else {
            // Check if player died from event
            if (this.gameState.player.ship.hull <= 0) {
                this.scene.start('GameOver', { gameState: this.gameState });
                return;
            }
            this.isPaused = false;
        }
    }

    private startCombat(): void {
        const leg = this.route.legs[Math.min(this.currentLeg, this.route.legs.length - 1)];
        this.combatState = this.combatSystem.createCombat(
            this.gameState.player.ship,
            leg.dangerLevel,
            this.gameState.player.daysSurvived
        );
        this.combatUI.resetForNewCombat();
        this.combatUI.updateDisplay(
            this.combatState,
            this.gameState.player.ship.maxHull,
            this.gameState.player.ship.maxShield
        );
        this.combatUI.setVisible(true);
    }

    private handleCombatAction(action: import('../systems/CombatSystem').CombatAction): void {
        if (!this.combatState) return;

        const crewCombat = this.crewManager.getSkillBonus(this.gameState.player.crew, 'combat');
        const crewPilot = this.crewManager.getSkillBonus(this.gameState.player.crew, 'piloting');
        const crewDiplomacy = this.crewManager.getSkillBonus(this.gameState.player.crew, 'diplomacy');

        this.combatState = this.combatSystem.processRound(
            this.combatState, action,
            this.gameState.player.ship,
            crewCombat, crewPilot, crewDiplomacy
        );

        // Apply damage to ship
        this.combatSystem.applyCombatResult(this.combatState, this.gameState.player.ship);

        this.combatUI.updateDisplay(
            this.combatState,
            this.gameState.player.ship.maxHull,
            this.gameState.player.ship.maxShield
        );
    }

    private handleCombatEnd(): void {
        if (!this.combatState) return;

        this.combatUI.setVisible(false);

        if (this.combatState.result === 'victory') {
            this.gameState.player.piratesDefeated++;

            // Collect loot
            if (this.combatState.loot) {
                const lootResult = this.combatSystem.collectLoot(
                    this.combatState.loot,
                    this.gameState.player.ship.cargo,
                    this.gameState.player.ship.cargoCapacity
                );
                this.gameState.player.credits += lootResult.creditsGained;

                this.gameState.eventLog.push({
                    time: this.timeSystem.currentTime,
                    type: 'combat',
                    message: `Victory! Gained ${lootResult.creditsGained} credits.`,
                });

                // Reputation for combat victory
                const currentSys = this.getSystem(this.route.path[Math.min(this.currentLeg, this.route.path.length - 1)]);
                if (currentSys) {
                    this.reputationSystem.onCombatVictory(
                        this.gameState.player, currentSys,
                        this.gameState.eventLog, this.timeSystem.currentTime
                    );
                }
            }

            this.crewManager.adjustMorale(this.gameState.player.crew, 5);
        } else if (this.combatState.result === 'defeat') {
            this.scene.start('GameOver', { gameState: this.gameState });
            return;
        } else if (this.combatState.result === 'fled') {
            this.gameState.eventLog.push({
                time: this.timeSystem.currentTime,
                type: 'combat',
                message: 'Escaped from combat.',
            });
        }

        this.combatState = null;

        // Check if player ship destroyed
        if (this.gameState.player.ship.hull <= 0) {
            this.scene.start('GameOver', { gameState: this.gameState });
            return;
        }

        this.isPaused = false;
    }

    private arriveAtDestination(): void {
        this.travelComplete = true;
        const destId = this.route.path[this.route.path.length - 1];
        const destSystem = this.getSystem(destId);

        this.gameState.player.currentSystemId = destId;
        this.gameState.player.isInTransit = false;
        this.gameState.player.transitRoute = null;

        // Mark as visited
        if (!this.gameState.player.systemsVisited.includes(destId)) {
            this.gameState.player.systemsVisited.push(destId);
        }

        // Discover
        if (destSystem && !destSystem.discovered) {
            destSystem.discovered = true;
        }

        this.gameState.eventLog.push({
            time: this.timeSystem.currentTime,
            type: 'travel',
            message: `Arrived at ${destSystem?.name ?? 'unknown system'}.`,
        });

        this.systemNameText.setText(`ARRIVED: ${destSystem?.name ?? '???'}`);
        this.statusText.setText('Docking...');

        // Check victory conditions
        if (this.gameState.player.credits >= VICTORY_CREDITS &&
            this.gameState.player.systemsVisited.length >= VICTORY_SYSTEMS &&
            this.gameState.player.totalTrades >= VICTORY_TRADES) {
            this.time.delayedCall(1500, () => {
                this.scene.start('VictoryScene', { gameState: this.gameState });
            });
            return;
        }

        // Save and transition to station
        this.timeSystem.saveToState(this.gameState);
        this.gameState.economyHistory = this.economyEngine.economyHistory;

        this.time.delayedCall(1500, () => {
            this.scene.start('StationScene', { gameState: this.gameState });
        });
    }

    private getSystem(id: string): StarSystemData | undefined {
        return this.gameState.galaxy.find(s => s.id === id);
    }
}
