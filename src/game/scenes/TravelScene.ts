// ============================================================
// Star Routes - Travel Scene
// In transit: parallax streaking stars, engine glow, danger
// vignette, glowing progress bar, dramatic event transitions
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
import { AudioManager } from '../audio/AudioManager';

interface StreamStar {
    graphic: GameObjects.Graphics;
    x: number;
    y: number;
    speed: number;
    length: number;
    alpha: number;
    layer: number;
}

interface EngineParticle {
    graphic: GameObjects.Arc;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

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
    private fromGlow!: GameObjects.Arc;
    private toDot!: GameObjects.Arc;
    private toGlow!: GameObjects.Arc;
    private routeLine!: GameObjects.Graphics;
    private progressBar!: GameObjects.Graphics;
    private progressText!: GameObjects.Text;
    private systemNameText!: GameObjects.Text;
    private statusText!: GameObjects.Text;
    private dangerVignette!: GameObjects.Graphics;

    // UI overlays
    private eventPanel!: EventPanel;
    private combatUI!: CombatUI;

    // State
    private isPaused: boolean = false;
    private combatState: CombatState | null = null;
    private travelComplete: boolean = false;

    // Background streaming stars
    private streamStars: StreamStar[] = [];
    private engineParticles: EngineParticle[] = [];
    private animTimer: number = 0;
    private currentDanger: number = 0;

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
        this.streamStars = [];
        this.engineParticles = [];
        this.animTimer = 0;

        // Calculate route danger
        if (this.route.legs.length > 0) {
            this.currentDanger = this.route.legs[0].dangerLevel;
        }

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

        // Fade in (warp arrival effect)
        this.cameras.main.fadeIn(500, 255, 255, 255);

        // Engine thrust audio
        AudioManager.play('engineThrust');

        // --- Streaming starfield (3 layers) ---
        this.createStreamingStarfield();

        // --- Danger vignette (red edges when danger is high) ---
        this.dangerVignette = this.add.graphics();
        this.dangerVignette.setDepth(5);
        this.drawDangerVignette(this.currentDanger);

        // --- Route visualization ---
        this.routeLine = this.add.graphics();
        this.routeLine.setDepth(10);
        this.drawRouteLine(0);

        // --- Glowing progress bar ---
        this.progressBar = this.add.graphics();
        this.progressBar.setDepth(10);

        // From dot with glow
        this.fromGlow = this.add.circle(200, GAME_HEIGHT / 2, 14, COLORS.positive, 0.08);
        this.fromGlow.setDepth(9);
        this.fromDot = this.add.circle(200, GAME_HEIGHT / 2, 6, COLORS.positive, 0.9);
        this.fromDot.setStrokeStyle(1.5, COLORS.positive, 0.7);
        this.fromDot.setDepth(11);

        // To dot with glow
        this.toGlow = this.add.circle(GAME_WIDTH - 200, GAME_HEIGHT / 2, 14, COLORS.textHighlight, 0.08);
        this.toGlow.setDepth(9);
        this.toDot = this.add.circle(GAME_WIDTH - 200, GAME_HEIGHT / 2, 6, COLORS.textHighlight, 0.9);
        this.toDot.setStrokeStyle(1.5, COLORS.textHighlight, 0.7);
        this.toDot.setDepth(11);

        // Ship
        this.shipEntity = new ShipEntity(this, 200, GAME_HEIGHT / 2 - 30, this.gameState.player.ship);
        this.shipEntity.setMoving(true, -Math.PI / 2);
        this.shipEntity.setDepth(20);

        // System names
        const fromSystem = this.getSystem(this.route.path[0]);
        const toSystem = this.getSystem(this.route.path[this.route.path.length - 1]);

        this.add.text(200, GAME_HEIGHT / 2 + 30, fromSystem?.name ?? '???', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0).setDepth(11);

        this.add.text(GAME_WIDTH - 200, GAME_HEIGHT / 2 + 30, toSystem?.name ?? '???', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0).setDepth(11);

        // Progress text
        this.progressText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '', {
            fontSize: '14px', fontFamily: 'monospace',
            color: '#' + COLORS.textPrimary.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0).setDepth(11);

        // System name being traveled to
        this.systemNameText = this.add.text(GAME_WIDTH / 2, 80, 'IN TRANSIT', {
            fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#' + COLORS.textHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 0.5).setDepth(11);

        // Status text
        this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
            align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(11);

        // Ship stats display with glowing bars
        const statsX = 20;
        const statsY = 20;
        this.add.text(statsX, statsY, `Hull: ${this.gameState.player.ship.hull}/${this.gameState.player.ship.maxHull}`, {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.hullBar.toString(16).padStart(6, '0'),
        }).setDepth(11);
        this.add.text(statsX, statsY + 18, `Fuel: ${this.gameState.player.ship.fuel}/${this.gameState.player.ship.maxFuel}`, {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.fuelBar.toString(16).padStart(6, '0'),
        }).setDepth(11);
        this.add.text(GAME_WIDTH - 20, statsY, this.timeSystem.formatTime(), {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#' + COLORS.textSecondary.toString(16).padStart(6, '0'),
        }).setOrigin(1, 0).setDepth(11);

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

    private createStreamingStarfield(): void {
        const layerConfigs = [
            { count: 60, minSpeed: 60, maxSpeed: 120, minLength: 3, maxLength: 8, alpha: 0.15 },    // far
            { count: 40, minSpeed: 140, maxSpeed: 250, minLength: 6, maxLength: 15, alpha: 0.3 },    // mid
            { count: 20, minSpeed: 280, maxSpeed: 450, minLength: 12, maxLength: 30, alpha: 0.5 },   // near
        ];

        for (let layer = 0; layer < layerConfigs.length; layer++) {
            const cfg = layerConfigs[layer];
            for (let i = 0; i < cfg.count; i++) {
                const graphic = this.add.graphics();
                graphic.setDepth(1 + layer);

                const star: StreamStar = {
                    graphic,
                    x: Math.random() * GAME_WIDTH,
                    y: Math.random() * GAME_HEIGHT,
                    speed: cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed),
                    length: cfg.minLength + Math.random() * (cfg.maxLength - cfg.minLength),
                    alpha: cfg.alpha * (0.5 + Math.random() * 0.5),
                    layer,
                };
                this.streamStars.push(star);
            }
        }
    }

    private drawRouteLine(progress: number): void {
        this.routeLine.clear();

        const routeWidth = GAME_WIDTH - 400;
        const routeY = GAME_HEIGHT / 2;

        // Base route line (dim)
        this.routeLine.lineStyle(2, COLORS.routeNormal, 0.2);
        this.routeLine.lineBetween(200, routeY, GAME_WIDTH - 200, routeY);

        // Traveled portion — bright glow + core
        const traveledX = 200 + routeWidth * progress;

        if (progress > 0.001) {
            // Glow
            this.routeLine.lineStyle(6, COLORS.textHighlight, 0.1);
            this.routeLine.lineBetween(200, routeY, traveledX, routeY);
            // Core
            this.routeLine.lineStyle(2, COLORS.textHighlight, 0.7);
            this.routeLine.lineBetween(200, routeY, traveledX, routeY);
        }
    }

    private drawDangerVignette(danger: number): void {
        this.dangerVignette.clear();

        if (danger < 0.2) return;

        const intensity = Math.min((danger - 0.2) * 0.8, 0.4);
        const edgeWidth = 60 + danger * 40;

        // Left edge
        for (let i = 0; i < edgeWidth; i++) {
            const a = intensity * (1 - i / edgeWidth) * 0.3;
            this.dangerVignette.lineStyle(1, COLORS.negative, a);
            this.dangerVignette.lineBetween(i, 0, i, GAME_HEIGHT);
        }
        // Right edge
        for (let i = 0; i < edgeWidth; i++) {
            const a = intensity * (1 - i / edgeWidth) * 0.3;
            this.dangerVignette.lineStyle(1, COLORS.negative, a);
            this.dangerVignette.lineBetween(GAME_WIDTH - i, 0, GAME_WIDTH - i, GAME_HEIGHT);
        }
        // Top edge
        for (let i = 0; i < edgeWidth * 0.5; i++) {
            const a = intensity * (1 - i / (edgeWidth * 0.5)) * 0.2;
            this.dangerVignette.lineStyle(1, COLORS.negative, a);
            this.dangerVignette.lineBetween(0, i, GAME_WIDTH, i);
        }
        // Bottom edge
        for (let i = 0; i < edgeWidth * 0.5; i++) {
            const a = intensity * (1 - i / (edgeWidth * 0.5)) * 0.2;
            this.dangerVignette.lineStyle(1, COLORS.negative, a);
            this.dangerVignette.lineBetween(0, GAME_HEIGHT - i, GAME_WIDTH, GAME_HEIGHT - i);
        }
    }

    private spawnEngineParticle(shipX: number, shipY: number): void {
        if (this.engineParticles.length > 30) return;

        const particle = this.add.circle(
            shipX + (Math.random() - 0.5) * 4,
            shipY + 12 + Math.random() * 4,
            1 + Math.random() * 2,
            COLORS.fuelBar,
            0.6
        );
        particle.setDepth(19);

        this.engineParticles.push({
            graphic: particle,
            x: particle.x,
            y: particle.y,
            vx: (Math.random() - 0.5) * 15,
            vy: 30 + Math.random() * 60,
            life: 0,
            maxLife: 0.4 + Math.random() * 0.4,
        });
    }

    update(_time: number, delta: number): void {
        if (this.isPaused || this.travelComplete) return;

        const dt = delta * 0.001;
        this.animTimer += dt;

        // --- Animate streaming stars ---
        for (const star of this.streamStars) {
            star.x -= star.speed * dt;

            if (star.x < -star.length * 2) {
                star.x = GAME_WIDTH + star.length;
                star.y = Math.random() * GAME_HEIGHT;
            }

            star.graphic.clear();
            const flicker = star.alpha * (0.7 + Math.sin(this.animTimer * 3 + star.y * 0.1) * 0.3);
            star.graphic.lineStyle(1, 0xffffff, flicker);
            star.graphic.lineBetween(star.x, star.y, star.x + star.length, star.y);
        }

        // --- Engine particles ---
        const shipX = this.shipEntity.x;
        const shipY = this.shipEntity.y + 30; // Offset for engine position

        if (Math.random() < 0.4) {
            this.spawnEngineParticle(shipX, shipY);
        }

        for (let i = this.engineParticles.length - 1; i >= 0; i--) {
            const p = this.engineParticles[i];
            p.life += dt;

            if (p.life >= p.maxLife) {
                p.graphic.destroy();
                this.engineParticles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.graphic.setPosition(p.x, p.y);

            const fadeOut = 1 - p.life / p.maxLife;
            p.graphic.setAlpha(fadeOut * 0.6);
            p.graphic.setScale(fadeOut);
        }

        // --- Pulse destination glow ---
        const toGlowPulse = 0.06 + Math.sin(this.animTimer * 2) * 0.04;
        this.toGlow.setAlpha(toGlowPulse);
        const fromGlowPulse = 0.04 + Math.sin(this.animTimer * 1.5) * 0.02;
        this.fromGlow.setAlpha(fromGlowPulse);

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

        // Update current danger for vignette
        this.currentDanger = leg.dangerLevel;
        this.drawDangerVignette(this.currentDanger);

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
            AudioManager.play('eventTrigger');
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

        // Update route line with progress
        this.drawRouteLine(overallProgress);

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
                AudioManager.stop('engineThrust');
                this.cameras.main.fadeOut(800, 20, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('GameOver', { gameState: this.gameState });
                });
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

        const prevPlayerHull = this.gameState.player.ship.hull;

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

        // --- Combat screen effects ---
        const lastLog = this.combatState.log[this.combatState.log.length - 1] ?? '';
        const damageTaken = prevPlayerHull - this.gameState.player.ship.hull;

        if (action === 'attack') {
            if (lastLog.includes('miss') || lastLog.includes('blocks') || lastLog.includes('dodge')) {
                // Miss — whoosh
                AudioManager.play('combatMiss');
            } else {
                // Hit landed
                AudioManager.play('combatHit');
                // Brief flash on enemy panel
                this.cameras.main.flash(120, 255, 60, 0, false);
            }
        }

        if (damageTaken > 0) {
            // Screen shake proportional to damage
            const intensity = Math.min(damageTaken * 0.002, 0.012);
            this.cameras.main.shake(150, intensity);
            AudioManager.play('combatHit');
        }

        // Shield block flash — blue
        if (lastLog.toLowerCase().includes('shield')) {
            this.cameras.main.flash(150, 0, 80, 255, false);
            AudioManager.play('shieldBlock');
        }

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
            AudioManager.stop('engineThrust');
            this.cameras.main.shake(500, 0.015);
            this.cameras.main.fadeOut(800, 20, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameOver', { gameState: this.gameState });
            });
            return;
        } else if (this.combatState.result === 'fled') {
            AudioManager.play('combatMiss');
            this.gameState.eventLog.push({
                time: this.timeSystem.currentTime,
                type: 'combat',
                message: 'Escaped from combat.',
            });
        }

        this.combatState = null;

        // Check if player ship destroyed
        if (this.gameState.player.ship.hull <= 0) {
            AudioManager.stop('engineThrust');
            this.cameras.main.fadeOut(800, 20, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameOver', { gameState: this.gameState });
            });
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

        // Remove danger vignette on arrival
        this.dangerVignette.clear();

        // Stop engine audio on docking
        AudioManager.stop('engineThrust');
        AudioManager.play('dockStation');

        // Check victory conditions
        if (this.gameState.player.credits >= VICTORY_CREDITS &&
            this.gameState.player.systemsVisited.length >= VICTORY_SYSTEMS &&
            this.gameState.player.totalTrades >= VICTORY_TRADES) {
            this.time.delayedCall(1200, () => {
                this.cameras.main.fadeOut(600, 255, 255, 255);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('VictoryScene', { gameState: this.gameState });
                });
            });
            return;
        }

        // Save and transition to station (docking animation: fade)
        this.timeSystem.saveToState(this.gameState);
        this.gameState.economyHistory = this.economyEngine.economyHistory;

        this.time.delayedCall(1200, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('StationScene', { gameState: this.gameState });
            });
        });
    }

    private getSystem(id: string): StarSystemData | undefined {
        return this.gameState.galaxy.find(s => s.id === id);
    }
}
